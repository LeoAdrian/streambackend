const fs = require('fs');
const express = require('express');
const torrentStream = require('torrent-stream');
const path = require('path');
const parseRange = require('range-parser');
const bodyParser = require('body-parser');
const TorrentSearchApi = require('torrent-search-api');
// Install cors in order to fix the cross origin err
const cors = require('cors');
// Instantiating torrentSearch for use
const torrentSearch = new TorrentSearchApi();

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

torrentSearch.enableProvider('1337x')

app.use(cors());

let uri = '';

const getMagnetLink = new Promise((resolve,reject) => {
// fetching the movie name from the frontend to get magnet link
app.post('/', function(req, res){
  let name = req.body.torrent;
  let rightSize = [];
  torrentSearch.search(name, 'Movies', 5)
  .then(torrents => {
    for(var i = 0; i < torrents.length; i++){
    if(parseFloat(torrents[i].size) !== null){
      rightSize.push(torrents[i]);
      break;
    }
  }
  torrentSearch.getMagnet(rightSize[0])
  .then(magnet => {
    uri = magnet;
    resolve(magnet)
    // console.log('URI is: \n',uri);
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
    engine.remove(() => console.log('Removed files'))
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

  app.get('/video', function(req, res) {
    getTorrentFile.then(result => {
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

app.listen('8000', function(){
  console.log('Server started');
})
