# Quiz App

A modern React-based quiz application that reads questions from Excel files and presents them in an interactive format.

## Features

- 📊 Reads questions from Excel (.xls) files
- 🎯 Detects correct answers based on yellow background highlighting
- 🎨 Beautiful, modern UI with smooth animations
- 📱 Responsive design for mobile and desktop
- 🔄 Random question selection
- ✅ Immediate feedback on answers
- 🚀 Ready for Vercel deployment

## How it works

The app reads Excel files from the `public` folder and processes them to extract:
- Questions (from the first column)
- Multiple choice answers (from subsequent columns)
- Correct answers (detected by yellow background highlighting)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add Excel files:**
   - Place your Excel files in the `public` folder
   - The app will automatically read files named `1.2.xls` and `1.3.xls`
   - Make sure correct answers are highlighted with yellow background

3. **Run the development server:**
   ```bash
   npm start
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Excel File Format

Your Excel files should follow this format:
- **Column A:** Questions
- **Columns B-E:** Multiple choice answers
- **Correct answer:** Highlighted with yellow background

Example:
```
| Question | Answer A | Answer B | Answer C | Answer D |
|----------|----------|----------|----------|----------|
| What is 2+2? | 3 | 4 | 5 | 6 |
```

Where "4" would be highlighted in yellow.

## Deployment to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub repository
   - Vercel will automatically detect it's a React app
   - Deploy!

## Customization

### Adding more Excel files:
1. Add your files to the `public` folder
2. Update the `files` array in `src/App.js`:
   ```javascript
   const files = ['1.2.xls', '1.3.xls', 'your-new-file.xls'];
   ```

### Styling:
- Modify `src/App.css` to change colors, fonts, and layout
- The app uses CSS custom properties for easy theming

### Question processing:
- The `processExcelData` function in `src/App.js` handles Excel parsing
- You can modify the logic to match your specific Excel format

## Troubleshooting

### Excel files not loading:
- Make sure files are in the `public` folder
- Check that file names match exactly (case-sensitive)
- Verify files are valid Excel format

### Correct answers not detected:
- Ensure correct answers have yellow background highlighting
- Check Excel file format and structure
- The app falls back to using the last answer if yellow highlighting isn't detected

### Build errors:
- Run `npm install` to ensure all dependencies are installed
- Check for any console errors in the browser developer tools

## Technologies Used

- **React** - Frontend framework
- **XLSX** - Excel file parsing
- **CSS3** - Modern styling with animations
- **Vercel** - Deployment platform

## License

MIT License - feel free to use and modify as needed!
