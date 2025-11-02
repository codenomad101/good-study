// Script to update JSON files to use correctOption instead of Answer
import fs from 'fs';
import path from 'path';

// List of JSON files to update
const jsonFiles = [
  'data/English/agricultureEnglish.json',
  'data/English/AptitudeEnglish.json',
  'data/English/economyEnglish.json',
  'data/English/englishGrammer.json',
  'data/English/geographyEnglish.json',
  'data/English/GKEnglish.json',
  'data/English/historyEnglish.json',
  'data/Marathi/grammerMarathi.json'
];

function updateJsonFile(filePath) {
  try {
    console.log(`Processing ${filePath}...`);
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const questions = JSON.parse(fileContent);
    
    if (!Array.isArray(questions)) {
      console.error(`Invalid format in ${filePath}: Expected array`);
      return;
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each question
    questions.forEach((question, index) => {
      try {
        // Check if Answer field exists and has "Option X" format
        if (question.Answer && typeof question.Answer === 'string' && question.Answer.startsWith('Option ')) {
          // Extract the number from "Option X"
          const optionNumber = parseInt(question.Answer.replace('Option ', ''));
          
          if (!isNaN(optionNumber) && optionNumber >= 1 && optionNumber <= 4) {
            // Add correctOption field
            question.correctOption = optionNumber;
            
            // Remove the old Answer field
            delete question.Answer;
            
            updatedCount++;
          } else {
            console.warn(`Invalid option number in ${filePath}, question ${index + 1}: ${question.Answer}`);
            errorCount++;
          }
        } else if (question.Answer) {
          // Answer field exists but not in expected format
          console.warn(`Unexpected Answer format in ${filePath}, question ${index + 1}: ${question.Answer}`);
        }
        
        // Validate that CorrectAnswer exists
        if (!question.CorrectAnswer) {
          console.warn(`Missing CorrectAnswer in ${filePath}, question ${index + 1}`);
        }
        
      } catch (questionError) {
        console.error(`Error processing question ${index + 1} in ${filePath}:`, questionError.message);
        errorCount++;
      }
    });
    
    // Write the updated file
    fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
    
    console.log(`✅ ${filePath}: Updated ${updatedCount} questions, ${errorCount} errors`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Process all files
console.log('Starting JSON file updates...\n');

jsonFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    updateJsonFile(filePath);
  } else {
    console.warn(`File not found: ${filePath}`);
  }
});

console.log('\n✅ JSON file update completed!');
