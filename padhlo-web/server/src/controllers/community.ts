import { Request, Response } from 'express';
import { db } from '../db';
import { communityGroups, communityGroupMembers, communityPosts, communityComments, communityLikes, communityJoinRequests, users } from '../db/schema';
import { createNotificationHelper } from './notifications';
import { eq, and, or } from 'drizzle-orm';

// Group controller functions
export const createGroup = async (req: Request, res: Response) => {
    const { name, description, examType, subjectId, isPublic } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!name || !description) {
        return res.status(400).json({ success: false, message: 'Name and description are required' });
    }

    try {
        // Insert group and add creator as admin member in a transaction-like approach
        const newGroup = await db.insert(communityGroups).values({ 
            name, 
            description, 
            createdBy: userId,
            examType: examType || null,
            subjectId: subjectId || null,
            isPublic: isPublic !== undefined ? isPublic : true
        }).returning();
        
        // Add creator as admin member (default role is 'student', but we set it to 'admin' for creator)
        try {
            await db.insert(communityGroupMembers).values({
                groupId: newGroup[0].groupId,
                userId: userId,
                role: 'admin' // 'admin' is a valid value in userRoleEnum
            });
            console.log(`✅ Group creator ${userId} added as admin member of group ${newGroup[0].groupId}`);
        } catch (memberError: any) {
            console.error('Error adding creator as member:', memberError);
            // If adding member fails, delete the group to maintain consistency
            await db.delete(communityGroups).where(eq(communityGroups.groupId, newGroup[0].groupId));
            throw new Error('Failed to add creator as member. Group creation rolled back.');
        }
        
        res.status(201).json(newGroup[0]);
    } catch (error: any) {
        console.error('Error creating group:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error creating group', 
            error: error?.message || 'Unknown error' 
        });
    }
};

export const getGroups = async (req: Request, res: Response) => {
    try {
        // Get groups with creator info
        const groups = await db
            .select({
                groupId: communityGroups.groupId,
                name: communityGroups.name,
                description: communityGroups.description,
                createdBy: communityGroups.createdBy,
                examType: communityGroups.examType,
                subjectId: communityGroups.subjectId,
                isPublic: communityGroups.isPublic,
                createdAt: communityGroups.createdAt,
                updatedAt: communityGroups.updatedAt,
                creator: {
                    userId: users.userId,
                    fullName: users.fullName,
                    email: users.email
                }
            })
            .from(communityGroups)
            .leftJoin(users, eq(communityGroups.createdBy, users.userId));
        
        // Format response to include creator info
        const formattedGroups = groups.map(group => ({
            ...group,
            creator: group.creator || null
        }));
        
        res.status(200).json(formattedGroups);
    } catch (error: any) {
        console.error('Error getting groups:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error getting groups', 
            error: error?.message || 'Unknown error' 
        });
    }
};

export const getGroup = async (req: Request, res: Response) => {
    const { groupId } = req.params;

    try {
        const groupResult = await db
            .select({
                groupId: communityGroups.groupId,
                name: communityGroups.name,
                description: communityGroups.description,
                createdBy: communityGroups.createdBy,
                examType: communityGroups.examType,
                subjectId: communityGroups.subjectId,
                isPublic: communityGroups.isPublic,
                createdAt: communityGroups.createdAt,
                updatedAt: communityGroups.updatedAt,
                creator: {
                    userId: users.userId,
                    fullName: users.fullName,
                    email: users.email
                }
            })
            .from(communityGroups)
            .leftJoin(users, eq(communityGroups.createdBy, users.userId))
            .where(eq(communityGroups.groupId, groupId));
            
        if (groupResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }
        
        const group = {
            ...groupResult[0],
            creator: groupResult[0].creator || null
        };
        
        res.status(200).json(group);
    } catch (error: any) {
        console.error('Error getting group:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error getting group', 
            error: error?.message || 'Unknown error' 
        });
    }
};

export const updateGroup = async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { name, description } = req.body;
    const userId = (req as any).user?.userId;

    try {
        const group = await db.select().from(communityGroups).where(eq(communityGroups.groupId, groupId));
        if (group.length === 0) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group[0].createdBy !== userId) {
            return res.status(403).json({ success: false, message: 'You are not authorized to update this group' });
        }

        const updatedGroup = await db.update(communityGroups).set({ name, description }).where(eq(communityGroups.groupId, groupId)).returning();
        res.status(200).json(updatedGroup[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating group', error });
    }
};

export const deleteGroup = async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = (req as any).user?.userId;

    try {
        const group = await db.select().from(communityGroups).where(eq(communityGroups.groupId, groupId));
        if (group.length === 0) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group[0].createdBy !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this group' });
        }

        await db.delete(communityGroups).where(eq(communityGroups.groupId, groupId));
        res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting group', error });
    }
};

// Group member controller functions
export const joinGroup = async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        // Check if already a member
        const existingMember = await db.select().from(communityGroupMembers).where(and(eq(communityGroupMembers.groupId, groupId), eq(communityGroupMembers.userId, userId)));
        if (existingMember.length > 0) {
            return res.status(400).json({ success: false, message: 'You are already a member of this group' });
        }

        // Check if there's a pending request
        const pendingRequest = await db.select().from(communityJoinRequests).where(and(
            eq(communityJoinRequests.groupId, groupId),
            eq(communityJoinRequests.userId, userId),
            eq(communityJoinRequests.status, 'pending')
        ));
        if (pendingRequest.length > 0) {
            return res.status(400).json({ success: false, message: 'You already have a pending join request' });
        }

        // Get group info to check if it's public
        const group = await db.select().from(communityGroups).where(eq(communityGroups.groupId, groupId));
        if (group.length === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // If group is public, join directly. Otherwise, create join request
        if (group[0].isPublic) {
        const newMember = await db.insert(communityGroupMembers).values({ groupId, userId }).returning();
            return res.status(201).json({ success: true, data: newMember[0], message: 'Successfully joined group' });
        } else {
            // Create join request
            const joinRequest = await db.insert(communityJoinRequests).values({ 
                groupId, 
                userId,
                status: 'pending'
            }).returning();
            return res.status(201).json({ success: true, data: joinRequest[0], message: 'Join request sent. Waiting for approval.' });
        }
    } catch (error: any) {
        console.error('Error joining group:', error);
        res.status(500).json({ success: false, message: 'Error joining group', error: error?.message });
    }
};

export const leaveGroup = async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const existingMember = await db.select().from(communityGroupMembers).where(and(eq(communityGroupMembers.groupId, groupId), eq(communityGroupMembers.userId, userId)));
        if (existingMember.length === 0) {
            return res.status(400).json({ message: 'You are not a member of this group' });
        }

        await db.delete(communityGroupMembers).where(and(eq(communityGroupMembers.groupId, groupId), eq(communityGroupMembers.userId, userId)));
        res.status(200).json({ message: 'You have left the group' });
    } catch (error) {
        res.status(500).json({ message: 'Error leaving group', error });
    }
};

export const getGroupMembers = async (req: Request, res: Response) => {
    const { groupId } = req.params;

    try {
        const members = await db
            .select({
                memberId: communityGroupMembers.memberId,
                groupId: communityGroupMembers.groupId,
                userId: communityGroupMembers.userId,
                role: communityGroupMembers.role,
                joinedAt: communityGroupMembers.joinedAt,
                user: {
                    userId: users.userId,
                    fullName: users.fullName,
                    email: users.email,
                    profilePictureUrl: users.profilePictureUrl
                }
            })
            .from(communityGroupMembers)
            .leftJoin(users, eq(communityGroupMembers.userId, users.userId))
            .where(eq(communityGroupMembers.groupId, groupId));
        
        const formattedMembers = members.map(member => ({
            ...member,
            user: member.user || null
        }));
        
        res.status(200).json(formattedMembers);
    } catch (error: any) {
        console.error('Error getting group members:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error getting group members', 
            error: error?.message || 'Unknown error' 
        });
    }
};

// Join Request controller functions
export const requestToJoin = async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        // Check if already a member
        const existingMember = await db.select().from(communityGroupMembers).where(and(eq(communityGroupMembers.groupId, groupId), eq(communityGroupMembers.userId, userId)));
        if (existingMember.length > 0) {
            return res.status(400).json({ success: false, message: 'You are already a member of this group' });
        }

        // Check if there's already a pending request
        const pendingRequest = await db.select().from(communityJoinRequests).where(and(
            eq(communityJoinRequests.groupId, groupId),
            eq(communityJoinRequests.userId, userId),
            eq(communityJoinRequests.status, 'pending')
        ));
        if (pendingRequest.length > 0) {
            return res.status(400).json({ success: false, message: 'You already have a pending join request' });
        }

        const joinRequest = await db.insert(communityJoinRequests).values({ 
            groupId, 
            userId,
            status: 'pending'
        }).returning();
        
        res.status(201).json({ success: true, data: joinRequest[0], message: 'Join request sent successfully' });
    } catch (error: any) {
        console.error('Error creating join request:', error);
        res.status(500).json({ success: false, message: 'Error creating join request', error: error?.message });
    }
};

export const getJoinRequests = async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        // Check if user is group creator or admin
        const group = await db.select().from(communityGroups).where(eq(communityGroups.groupId, groupId));
        if (group.length === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const member = await db.select().from(communityGroupMembers).where(and(
            eq(communityGroupMembers.groupId, groupId),
            eq(communityGroupMembers.userId, userId),
            or(eq(communityGroupMembers.role, 'admin'), eq(communityGroupMembers.role, 'moderator'))
        ));

        if (group[0].createdBy !== userId && member.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not authorized to view join requests' });
        }

        const requests = await db
            .select({
                requestId: communityJoinRequests.requestId,
                groupId: communityJoinRequests.groupId,
                userId: communityJoinRequests.userId,
                status: communityJoinRequests.status,
                requestedAt: communityJoinRequests.requestedAt,
                reviewedAt: communityJoinRequests.reviewedAt,
                reviewedBy: communityJoinRequests.reviewedBy,
                rejectionReason: communityJoinRequests.rejectionReason,
                user: {
                    userId: users.userId,
                    fullName: users.fullName,
                    email: users.email,
                    profilePictureUrl: users.profilePictureUrl
                }
            })
            .from(communityJoinRequests)
            .leftJoin(users, eq(communityJoinRequests.userId, users.userId))
            .where(eq(communityJoinRequests.groupId, groupId));
        
        const formattedRequests = requests.map(req => ({
            ...req,
            user: req.user || null
        }));
        
        res.status(200).json({ success: true, data: formattedRequests });
    } catch (error: any) {
        console.error('Error getting join requests:', error);
        res.status(500).json({ success: false, message: 'Error getting join requests', error: error?.message });
    }
};

export const approveJoinRequest = async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const request = await db.select().from(communityJoinRequests).where(eq(communityJoinRequests.requestId, requestId));
        if (request.length === 0) {
            return res.status(404).json({ success: false, message: 'Join request not found' });
        }

        if (request[0].status !== 'pending') {
            return res.status(400).json({ success: false, message: 'This request has already been processed' });
        }

        // Check authorization
        const group = await db.select().from(communityGroups).where(eq(communityGroups.groupId, request[0].groupId));
        if (group.length === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const member = await db.select().from(communityGroupMembers).where(and(
            eq(communityGroupMembers.groupId, request[0].groupId),
            eq(communityGroupMembers.userId, userId),
            or(eq(communityGroupMembers.role, 'admin'), eq(communityGroupMembers.role, 'moderator'))
        ));

        if (group[0].createdBy !== userId && member.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not authorized to approve join requests' });
        }

        // Update request status
        await db.update(communityJoinRequests)
            .set({ 
                status: 'approved',
                reviewedAt: new Date(),
                reviewedBy: userId
            })
            .where(eq(communityJoinRequests.requestId, requestId));

        // Add user as member
        await db.insert(communityGroupMembers).values({
            groupId: request[0].groupId,
            userId: request[0].userId
        });

        // Notify user that their join request was approved
        const [groupInfo] = await db
            .select({ name: communityGroups.name })
            .from(communityGroups)
            .where(eq(communityGroups.groupId, request[0].groupId))
            .limit(1);
        
        await createNotificationHelper(
            request[0].userId,
            'join_request',
            'Join Request Approved',
            `Your request to join "${groupInfo?.name || 'the group'}" has been approved!`,
            `/community/groups/${request[0].groupId}`
        );

        res.status(200).json({ success: true, message: 'Join request approved successfully' });
    } catch (error: any) {
        console.error('Error approving join request:', error);
        res.status(500).json({ success: false, message: 'Error approving join request', error: error?.message });
    }
};

export const rejectJoinRequest = async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const request = await db.select().from(communityJoinRequests).where(eq(communityJoinRequests.requestId, requestId));
        if (request.length === 0) {
            return res.status(404).json({ success: false, message: 'Join request not found' });
        }

        if (request[0].status !== 'pending') {
            return res.status(400).json({ success: false, message: 'This request has already been processed' });
        }

        // Check authorization
        const group = await db.select().from(communityGroups).where(eq(communityGroups.groupId, request[0].groupId));
        if (group.length === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const member = await db.select().from(communityGroupMembers).where(and(
            eq(communityGroupMembers.groupId, request[0].groupId),
            eq(communityGroupMembers.userId, userId),
            or(eq(communityGroupMembers.role, 'admin'), eq(communityGroupMembers.role, 'moderator'))
        ));

        if (group[0].createdBy !== userId && member.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not authorized to reject join requests' });
        }

        // Update request status
        await db.update(communityJoinRequests)
            .set({ 
                status: 'rejected',
                reviewedAt: new Date(),
                reviewedBy: userId,
                rejectionReason: rejectionReason || null
            })
            .where(eq(communityJoinRequests.requestId, requestId));

        // Notify user that their join request was rejected
        const [groupInfo] = await db
            .select({ name: communityGroups.name })
            .from(communityGroups)
            .where(eq(communityGroups.groupId, request[0].groupId))
            .limit(1);
        
        await createNotificationHelper(
            request[0].userId,
            'join_request',
            'Join Request Rejected',
            `Your request to join "${groupInfo?.name || 'the group'}" has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
            `/community`
        );

        res.status(200).json({ success: true, message: 'Join request rejected successfully' });
    } catch (error: any) {
        console.error('Error rejecting join request:', error);
        res.status(500).json({ success: false, message: 'Error rejecting join request', error: error?.message });
    }
};

// Post controller functions
export const createPost = async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { postContent } = req.body;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    if (!postContent || !postContent.trim()) {
        return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    try {
        const newPost = await db.insert(communityPosts).values({ groupId, userId, postContent }).returning();
        res.status(201).json(newPost[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error creating post', error });
    }
};

export const getPosts = async (req: Request, res: Response) => {
    const { groupId } = req.params;

    try {
        const posts = await db
            .select({
                postId: communityPosts.postId,
                groupId: communityPosts.groupId,
                userId: communityPosts.userId,
                postContent: communityPosts.postContent,
                isVulgar: communityPosts.isVulgar,
                createdAt: communityPosts.createdAt,
                updatedAt: communityPosts.updatedAt,
                user: {
                    userId: users.userId,
                    fullName: users.fullName,
                    email: users.email,
                    profilePictureUrl: users.profilePictureUrl
                }
            })
            .from(communityPosts)
            .leftJoin(users, eq(communityPosts.userId, users.userId))
            .where(eq(communityPosts.groupId, groupId));
        
        // Format response to include user info
        const formattedPosts = posts.map(post => ({
            ...post,
            user: post.user || null
        }));
        
        // Sort by createdAt descending (newest first)
        formattedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        res.status(200).json(formattedPosts);
    } catch (error: any) {
        console.error('Error getting posts:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error getting posts', 
            error: error?.message || 'Unknown error' 
        });
    }
};

export const getPost = async (req: Request, res: Response) => {
    const { postId } = req.params;

    try {
        const postResult = await db
            .select({
                postId: communityPosts.postId,
                groupId: communityPosts.groupId,
                userId: communityPosts.userId,
                postContent: communityPosts.postContent,
                isVulgar: communityPosts.isVulgar,
                createdAt: communityPosts.createdAt,
                updatedAt: communityPosts.updatedAt,
                user: {
                    userId: users.userId,
                    fullName: users.fullName,
                    email: users.email,
                    profilePictureUrl: users.profilePictureUrl
                }
            })
            .from(communityPosts)
            .leftJoin(users, eq(communityPosts.userId, users.userId))
            .where(eq(communityPosts.postId, postId));
            
        if (postResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        
        const post = {
            ...postResult[0],
            user: postResult[0].user || null
        };
        
        res.status(200).json(post);
    } catch (error: any) {
        console.error('Error getting post:', error);
        res.status(500).json({ success: false, message: 'Error getting post', error: error?.message });
    }
};

export const updatePost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { postContent } = req.body;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const post = await db.select().from(communityPosts).where(eq(communityPosts.postId, postId));
        if (post.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post[0].userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to update this post' });
        }

        const updatedPost = await db.update(communityPosts).set({ postContent }).where(eq(communityPosts.postId, postId)).returning();
        res.status(200).json(updatedPost[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating post', error });
    }
};

export const deletePost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const post = await db.select().from(communityPosts).where(eq(communityPosts.postId, postId));
        if (post.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post[0].userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this post' });
        }

        await db.delete(communityPosts).where(eq(communityPosts.postId, postId));
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting post', error });
    }
};

// Comment controller functions
export const createComment = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { commentContent } = req.body;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    if (!commentContent || !commentContent.trim()) {
        return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    try {
        // Get the post to find the post owner
        const [post] = await db
            .select({ userId: communityPosts.userId })
            .from(communityPosts)
            .where(eq(communityPosts.postId, postId))
            .limit(1);
        
        const newComment = await db.insert(communityComments).values({ postId, userId, commentContent }).returning();
        
        // Create notification for post owner if comment is not from the post owner
        if (post && post.userId !== userId) {
            const [commenter] = await db
                .select({ fullName: users.fullName })
                .from(users)
                .where(eq(users.userId, userId))
                .limit(1);
            
            await createNotificationHelper(
                post.userId,
                'comment_reply',
                'New Comment on Your Post',
                `${commenter?.fullName || 'Someone'} commented on your post`,
                `/community/posts/${postId}`
            );
        }
        
        res.status(201).json(newComment[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error creating comment', error });
    }
};

export const getComments = async (req: Request, res: Response) => {
    const { postId } = req.params;

    try {
        const comments = await db
            .select({
                commentId: communityComments.commentId,
                postId: communityComments.postId,
                userId: communityComments.userId,
                commentContent: communityComments.commentContent,
                isVulgar: communityComments.isVulgar,
                createdAt: communityComments.createdAt,
                updatedAt: communityComments.updatedAt,
                user: {
                    userId: users.userId,
                    fullName: users.fullName,
                    email: users.email,
                    profilePictureUrl: users.profilePictureUrl
                }
            })
            .from(communityComments)
            .leftJoin(users, eq(communityComments.userId, users.userId))
            .where(eq(communityComments.postId, postId));
        
        // Format response to include user info
        const formattedComments = comments.map(comment => ({
            ...comment,
            user: comment.user || null
        }));
        
        // Sort by createdAt ascending (oldest first)
        formattedComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        res.status(200).json(formattedComments);
    } catch (error: any) {
        console.error('Error getting comments:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error getting comments', 
            error: error?.message || 'Unknown error' 
        });
    }
};

export const updateComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const { commentContent } = req.body;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const comment = await db.select().from(communityComments).where(eq(communityComments.commentId, commentId));
        if (comment.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment[0].userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to update this comment' });
        }

        const updatedComment = await db.update(communityComments).set({ commentContent }).where(eq(communityComments.commentId, commentId)).returning();
        res.status(200).json(updatedComment[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating comment', error });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const comment = await db.select().from(communityComments).where(eq(communityComments.commentId, commentId));
        if (comment.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment[0].userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this comment' });
        }

        await db.delete(communityComments).where(eq(communityComments.commentId, commentId));
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting comment', error });
    }
};

// Like controller functions
export const likePost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const existingLike = await db.select().from(communityLikes).where(and(eq(communityLikes.postId, postId), eq(communityLikes.userId, userId)));
        if (existingLike.length > 0) {
            await db.delete(communityLikes).where(and(eq(communityLikes.postId, postId), eq(communityLikes.userId, userId)));
            return res.status(200).json({ message: 'Post unliked' });
        }

        const newLike = await db.insert(communityLikes).values({ postId, userId }).returning();
        res.status(201).json(newLike[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error liking post', error });
    }
};

export const likeComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const existingLike = await db.select().from(communityLikes).where(and(eq(communityLikes.commentId, commentId), eq(communityLikes.userId, userId)));
        if (existingLike.length > 0) {
            await db.delete(communityLikes).where(and(eq(communityLikes.commentId, commentId), eq(communityLikes.userId, userId)));
            return res.status(200).json({ message: 'Comment unliked' });
        }

        const newLike = await db.insert(communityLikes).values({ commentId, userId }).returning();
        res.status(201).json(newLike[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error liking comment', error });
    }
};
