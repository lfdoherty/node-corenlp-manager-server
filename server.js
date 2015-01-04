
var jot = require('json-over-tcp');

var port = 8099
var server = jot.createServer(port);

var child_process = require('child_process')
var current_child
function makeWorker(){
	current_child = child_process.fork('./worker')
	current_child.on('message', function(msg){
		if(msg.type === 'please-end'){
			var bk = current_child
			setTimeout(function(){
				bk.kill()
			},10000)
			makeWorker()
		}else{
			var listenersToRemove = []
			listeners.forEach(function(listener){
				try{
					listener(msg)
				}catch(e){
					console.log('ERROR: ' + e)
					listenersToRemove.push(listener)
				}
			})
			listenersToRemove.forEach(function(v){
				listeners.splice(listeners.indexOf(v),1)
			})
		}
	})
}

var listeners = []
var idCounter = 1
makeWorker()

server.on('connection', function (c){
	var openPipeline
	var openPipelineKey
	var configByKey = {}
	var openPipelineIdMap = {}
	c.on('error', function(e){
		console.log('socket error: ' + e)
	})

	var senderId = ++idCounter

	listeners.push(function(msg){
		if(msg.sender === senderId){
			c.write(msg)
		}
	})
	c.on('data', function(data){
		current_child.send({sender: senderId, value: data})
	});
});

server.listen(port)


