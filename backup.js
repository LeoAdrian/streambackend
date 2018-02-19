
/*
app.use('*',function(req, res){
  if (req.url != '/Guardians.of.the.Galaxy.2014.1080p.BluRay.x264.YIFY.mp4') {
      if (req.method !== 'GET') return res.end();
      var rpath = __dirname + '/views/index.html';
      fs.readFile(rpath, function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
      });
    }
})

*/
/*
app.use('*', function(req, res) {
  if (req.url != '/Guardians.of.the.Galaxy.2014.1080p.BluRay.x264.YIFY.mp4') {
      if (req.method !== 'GET') return res.end();
      var rpath = __dirname + '/views/index.html';
      fs.readFile(rpath, function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
      });
    } else {
      res.setHeader('Accept-Ranges', 'bytes');
  getTorrentFile.then(function( result ) {
var filer = path.resolve(__dirname,'Guardians.of.the.Galaxy.2014.1080p.BluRay.x264.YIFY.mp4');
const stat = fs.statSync(path)
const fileSize = stat.size
const range = req.headers.range
if (range) {
const parts = range.replace(/bytes=/, "").split("-")
const start = parseInt(parts[0], 10)
const end = parts[1]
? parseInt(parts[1], 10)
: fileSize-1
const chunksize = (end-start)+1
const file = fs.createReadStream(path, {start, end})
const head = {
'Content-Range': `bytes ${start}-${end}/${fileSize}`,
'Accept-Ranges': 'bytes',
'Content-Length': chunksize,
'Content-Type': 'video/mp4',
}
res.writeHead(206, head);
file.pipe(res);
} else {
const head = {
'Content-Length': fileSize,
'Content-Type': 'video/mp4',
}
res.writeHead(200, head)
fs.createReadStream(path).pipe(res)
}
});
}
});
*/
