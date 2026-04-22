const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('.git') && !file.includes('node_modules')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.html')) {
      results.push(file);
    }
  });
  return results;
}

const htmlFiles = walk('.');
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let errs = [];
  
  // check images
  const imgs = content.match(/<img[^>]+src=['"]([^'"]*)['"]/gi);
  if (imgs) {
    imgs.forEach(img => {
      const src = img.match(/src=['"]([^'"]*)['"]/i)[1];
      if(src.startsWith('http') || src.startsWith('data:') || src === '') return;
      const targetPath = path.resolve(path.dirname(f), src);
      if (!fs.existsSync(targetPath)) {
        errs.push('Broken Image: ' + src + ' expected at ' + targetPath);
      }
    });
  }

  // check scripts
  const scripts = content.match(/<script[^>]+src=['"]([^'"]*)['"]/gi);
  if (scripts) {
    scripts.forEach(s => {
      const src = s.match(/src=['"]([^'"]*)['"]/i)[1];
      if(src.startsWith('http') || src.startsWith('data:') || src === '') return;
      const targetPath = path.resolve(path.dirname(f), src);
      if (!fs.existsSync(targetPath)) {
        errs.push('Broken Script: ' + src + ' expected at ' + targetPath);
      }
    });
  }
  
  // check links
  const links = content.match(/<link[^>]+href=['"]([^'"]*)['"]/gi);
  if (links) {
    links.forEach(l => {
      const href = l.match(/href=['"]([^'"]*)['"]/i)[1];
      if(href.startsWith('http') || href.startsWith('data:') || href === '') return;
      const targetPath = path.resolve(path.dirname(f), href);
      if (!fs.existsSync(targetPath)) {
        errs.push('Broken CSS/Link: ' + href + ' expected at ' + targetPath);
      }
    });
  }

  if (errs.length > 0) {
    console.log("--- " + f);
    errs.forEach(e => console.log(e));
  }
});
