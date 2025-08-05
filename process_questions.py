import json
import os

def process_questions():
    """Process and print the first 20 rows of questions.json"""
    
    # Path to the questions.json file
    questions_file = "public/questions.json"
    
    # Check if file exists
    if not os.path.exists(questions_file):
        print(f"Error: {questions_file} not found!")
        return
    
    try:
        # Read the JSON file
        with open(questions_file, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        
        print(f"Total questions in file: {len(questions)}")
        print("=" * 80)
        
        # Process first 20 rows (or all if less than 20)
        rows_to_process = min(20, len(questions))
        
        for i in range(rows_to_process):
            question = questions[i]
            
            print(f"\n--- Row {i + 1} ---")
            print(f"Question Group: {question.get('questionGroup', 'N/A')}")
            print(f"Question: {question.get('question', 'N/A')}")
            print(f"Answers:")
            for j, answer in enumerate(question.get('answers', [])):
                marker = "✓" if j == question.get('correctAnswerIndex', -1) else " "
                print(f"  {marker} {j + 1}. {answer}")
            print(f"Correct Answer Index: {question.get('correctAnswerIndex', 'N/A')}")
            print(f"Source File: {question.get('sourceFile', 'N/A')}")
            print("-" * 60)
        
        # Summary statistics
        print(f"\n=== SUMMARY ===")
        print(f"Processed {rows_to_process} rows")
        
        # Count unique question groups
        question_groups = set()
        for i in range(rows_to_process):
            question_groups.add(questions[i].get('questionGroup', 'Unknown'))
        
        print(f"Unique question groups in first {rows_to_process} rows: {len(question_groups)}")
        print("Question groups found:")
        for group in sorted(question_groups):
            print(f"  - {group}")
            
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process_questions() 