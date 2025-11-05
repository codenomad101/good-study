-- Add MPSC exams to available_exams table
-- Run this SQL script in your database to add the 5 MPSC exams

INSERT INTO available_exams (exam_name, exam_date, is_active, sort_order, created_at, updated_at)
VALUES 
  ('MPSC Group B (Non-Gazetted) Prelims', '2025-01-05', true, 0, NOW(), NOW()),
  ('MPSC Group C Prelims', '2025-06-01', true, 1, NOW(), NOW()),
  ('MPSC Group C Mains', '2026-01-07', true, 2, NOW(), NOW()),
  ('MPSC Rajyaseva Prelims', '2025-11-09', true, 3, NOW(), NOW()),
  ('MPSC Group B Mains', '2026-12-05', true, 4, NOW(), NOW())
ON CONFLICT DO NOTHING;

