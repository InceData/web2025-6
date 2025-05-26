const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const multer = require('multer');
const { program } = require('commander');

program
  .requiredOption('-h, --host <host>', 'host address')
  .requiredOption('-p, --port <port>', 'port number')
  .requiredOption('-c, --cache <path>', 'cache directory path');

program.parse(process.argv);
const options = program.opts();

const app = express();
const upload = multer(); 


const cacheDir = path.resolve(options.cache);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// UploadForm.html
app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.resolve('./UploadForm.html'));
});

// GET /notes — список
app.get('/notes', async (req, res) => {
  try {
    const files = await fs.readdir(cacheDir);
    const notes = [];
    for (const file of files) {
      const filePath = path.join(cacheDir, file);
      const text = await fs.readFile(filePath, 'utf-8');
      notes.push({ name: file, text });
    }
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// GET 
app.get('/notes/:name', async (req, res) => {
  const noteName = req.params.name;
  const notePath = path.join(cacheDir, noteName);
  try {
    const text = await fs.readFile(notePath, 'utf-8');
    res.send(text);
  } catch {
    res.status(404).send('Not found');
  }
});

// PUT 
app.put('/notes/:name', express.text(), async (req, res) => {
  const noteName = req.params.name;
  const notePath = path.join(cacheDir, noteName);
  try {

    await fs.access(notePath);

    await fs.writeFile(notePath, req.body, 'utf-8');
    res.status(200).send('Updated');
  } catch {
    res.status(404).send('Not found');
  }
});

// DELETE 
app.delete('/notes/:name', async (req, res) => {
  const noteName = req.params.name;
  const notePath = path.join(cacheDir, noteName);
  try {
    await fs.unlink(notePath);
    res.status(200).send('Deleted');
  } catch {
    res.status(404).send('Not found');
  }
});

// POST 
app.post('/write', upload.none(), async (req, res) => {
  const { note_name, note } = req.body;
  if (!note_name || !note) {
    return res.status(400).send('Missing note_name or note');
  }

  const notePath = path.join(cacheDir, note_name);
  try {
    await fs.access(notePath);
    return res.status(400).send('Note already exists');
  } catch {
    try {
      await fs.writeFile(notePath, note, 'utf-8');
      res.status(201).send('Created');
    } catch {
      res.status(500).send('Server error');
    }
  }
});


app.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
  console.log(`Cache directory: ${cacheDir}`);
});
