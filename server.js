const fs = require('fs');
const app = require('express')();
const torrentStream = require('torrent-stream');
const path = require('path');
const parseRange = require('range-parser');
const bodyParser = require('body-parser');
const TorrentSearchApi = require('torrent-search-api');
// Install cors in order to fix the cross origin err
const cors = require('cors');
// Instantiating torrentSearch for use
const torrentSearch = new TorrentSearchApi();

// Socket.io integration
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

torrentSearch.enableProvider('1337x')

app.use(cors());

  const getMagnetLink = new Promise((resolve,reject) => {
  // fetching the movie name from the frontend to get magnet link
  app.post('/', function(req, res){
    let name = req.body.torrent;
    console.log('Name from the frontend: ',name);
    let rightSize = [];
    torrentSearch.search(name, 'Movies', 5)
    .then(torrents => {
      for(var i = 0; i < torrents.length; i++){
      if(parseFloat(torrents[i].size) !== null){
        rightSize.push(torrents[i]);
        break;
      }
    }
    console.log('Torrent details: ',rightSize[0])
    torrentSearch.getMagnet(rightSize[0])
    .then(magnet => {
      uri = magnet;
      resolve(magnet)
      console.log('URI is: \n',uri);
      })
    .catch(err => console.log(err))
  }
  )
    .catch(err => console.log(err))
  })
  })

  getMagnetLink
  .then(magnet => {
    let engine = torrentStream(magnet);
    const getTorrentFile = new Promise (function(resolve, reject){
       engine.on('ready', function() {
        engine.files.forEach(function(file) {
                 if (file.name.substr(file.name.length - 3) == 'mkv' || file.name.substr(file.name.length - 3) == 'mp4') {
                   console.log('filename:', file.name);
                   var stream = file.createReadStream();
                   var writable = fs.createWriteStream(file.name);
                   stream.pipe(writable);
                   engine.on('download', function () {
                     console.log(file.name);
                     console.log(engine.swarm.downloaded / file.length * 100 + "%");
                     resolve(file);
                   });
                   engine.on('idle', function(){
                     console.log('Finished downloading file');
                     // engine.remove(() => console.log('removed'))
                   })
                 }
        });
      });
    });

    app.get('/', function(req, res){
      res.sendFile(path.resolve(__dirname + '/views/index.html'));
    })


    io.on('connection', function(socket){
      console.log('A client connected');
      socket.on('disconnect', function(){
        console.log('Client disconnected');
        engine.destroy(function(){console.log('Engine destroyed')});
        // Getting the name of the movie that will be deleted
        getTorrentFile.then(result => {
          // Check to see if the file name is the same as result.name
          if(result.name){
            // Delete file if we find it
            fs.unlink(result.name, function(err){
              if(err) throw err;
              console.log('Movie was deleted');
            })
          }
        })
        engine.remove(function(){console.log('All files removed from memory')});
      })
    })

// Route that serves the stream to the video tag in index
    app.get('/video', function(req, res) {
      getTorrentFile.then(result => {
        // Path to the file that\'s being downloaded
        const path = result.name
        const stat = fs.statSync(path)
        const fileSize = stat.size
        const ranges = parseRange(result.length, req.headers.range, { combine: true });
        if (ranges === -1) {
            // 416 Requested Range Not Satisfiable
            res.statusCode = 416;
            return res.end();
          } else if (ranges === -2 || ranges.type !== 'bytes' || ranges.length > 1) {
            // 200 OK requested range malformed or multiple ranges requested, stream entire video
            if (req.method !== 'GET') return res.end();
            result.createReadStream().pipe(res);
          } else {
            // 206 Partial Content valid range requested
            const range = ranges[0];
            res.statusCode = 206;
            res.setHeader('Content-Length', 1 + range.end - range.start);
            res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${result.length}`)
          fs.createReadStream(path).pipe(res)
    }
    })
  });
  })


http.listen('8000', function(){
  console.log('Listening on port 8000');
})
