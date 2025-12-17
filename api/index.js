import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Servir archivos estáticos de public
  const publicPath = path.join(process.cwd(), 'public');
  
  // Por defecto, servir index.html
  let filePath = path.join(publicPath, 'index.html');
  
  // Si el request es para un archivo específico, intentar servirlo
  if (req.url && req.url !== '/') {
    const requestedFile = path.join(publicPath, req.url.replace(/^\/?/, ''));
    if (fs.existsSync(requestedFile)) {
      filePath = requestedFile;
    }
  }

  try {
    const file = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);
    
    // Determinar content-type
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.json': 'application/json',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml'
    };
    
    const contentType = contentTypes[ext] || 'text/plain';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(file);
  } catch (error) {
    // Si no existe, servir index.html (para SPA routing)
    try {
      const indexFile = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(indexFile);
    } catch (e) {
      res.status(404).send('Not Found');
    }
  }
}
