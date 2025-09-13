const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Configuration
const config = {
  inputDir: './images',
  outputDir: './dist/images',
  qualities: {
    jpg: 80,
    webp: 80,
    png: 90,
  },
  sizes: [
    { width: 1920, suffix: '_large' },
    { width: 1024, suffix: '_medium' },
    { width: 640, suffix: '_small' },
  ],
};

// Ensure output directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Process a single image
const processImage = async (filePath, outputDir, baseName, ext) => {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    
    // Create different sizes for each image
    for (const size of config.sizes) {
      // Skip if the original is smaller than the target size
      if (metadata.width <= size.width) continue;
      
      const outputFile = path.join(outputDir, `${baseName}${size.suffix}${ext}`);
      
      console.log(`Creating ${path.basename(outputFile)} (${size.width}px)`);
      
      await image
        .resize({ width: size.width })
        .toFile(outputFile);
        
      // Create WebP version
      if (['.jpg', '.jpeg', '.png'].includes(ext.toLowerCase())) {
        const webpFile = path.join(outputDir, `${baseName}${size.suffix}.webp`);
        await image
          .toFormat('webp', { quality: config.qualities.webp })
          .toFile(webpFile);
      }
    }
    
    // Create original size WebP version
    if (['.jpg', '.jpeg', '.png'].includes(ext.toLowerCase())) {
      const webpFile = path.join(outputDir, `${baseName}.webp`);
      await image
        .toFormat('webp', { quality: config.qualities.webp })
        .toFile(webpFile);
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
};

// Process all images in a directory
const processDirectory = async (dir, outputDir) => {
  try {
    const files = await readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const fileStat = await stat(filePath);
      
      if (fileStat.isDirectory()) {
        const subDir = path.join(outputDir, file);
        ensureDir(subDir);
        await processDirectory(filePath, subDir);
      } else {
        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext);
        
        // Skip non-image files and already processed files
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext) || 
            baseName.endsWith('_small') || 
            baseName.endsWith('_medium') || 
            baseName.endsWith('_large')) {
          continue;
        }
        
        console.log(`\nProcessing ${file}...`);
        await processImage(filePath, outputDir, baseName, ext);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
};

// Main function
const main = async () => {
  console.log('🚀 Starting image optimization...');
  
  try {
    // Ensure output directory exists
    ensureDir(config.outputDir);
    
    // Process images
    await processDirectory(config.inputDir, config.outputDir);
    
    console.log('\n✅ Image optimization completed successfully!');
  } catch (error) {
    console.error('❌ Error during image optimization:', error);
    process.exit(1);
  }
};

// Run the script
main();
