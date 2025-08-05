import openpyxl
import os

def log_specific_rows():
    """Log rows 95-97 from 6.4.xlsx to debug the issue"""
    
    file_path = 'public/xlsx/6.4.xlsx'
    
    if not os.path.exists(file_path):
        print(f"File {file_path} not found!")
        return
    
    print(f"Logging rows 95-97 from: {file_path}")
    print("=" * 80)
    
    try:
        # Load workbook with formatting
        wb = openpyxl.load_workbook(file_path, data_only=False)
        ws = wb.active
        
        print(f"Sheet name: {ws.title}")
        print("=" * 80)
        
        # Log rows 95-97 (1-indexed, so rows 95, 96, 97)
        for row_num in range(95, 98):
            print(f"\nRow {row_num}:")
            print("-" * 40)
            
            # Get all cells in this row
            for col_num in range(1, 11):  # Columns A-J
                cell = ws.cell(row=row_num, column=col_num)
                cell_value = cell.value
                cell_address = cell.coordinate
                
                # Check background color
                bg_color = "None"
                try:
                    if cell.fill and cell.fill.bgColor:
                        if hasattr(cell.fill.bgColor, 'indexed'):
                            bg_color = f"indexed={cell.fill.bgColor.indexed}"
                        elif hasattr(cell.fill.bgColor, 'rgb'):
                            bg_color = f"rgb={cell.fill.bgColor.rgb}"
                        else:
                            bg_color = str(cell.fill.bgColor)
                except Exception as e:
                    bg_color = f"Error: {e}"
                
                # Truncate long values for display
                display_value = str(cell_value)[:100] + "..." if cell_value and len(str(cell_value)) > 100 else str(cell_value)
                print(f"  {cell_address}: '{display_value}' (bg: {bg_color})")
        
        print("\n" + "=" * 80)
        
    except Exception as e:
        print(f"Error reading file: {e}")

if __name__ == "__main__":
    log_specific_rows() 