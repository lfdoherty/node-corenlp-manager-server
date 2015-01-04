
var jot = require('json-over-tcp');

var port = 8099
var server = jot.createServer(port);

var activePipelines = []

var child_process = require('child_process')
var current_child
function makeWorker(){
	current_child = child_process.fork('./worker')
	current_child.on('message', function(msg){
		if(msg.type === 'please-end'){
			var bk = current_child
			console.log('received end request')
			setTimeout(function(){
				console.log('killed old child')
				bk.kill('SIGKILL')
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
	console.log('resending active pipelines: ' + JSON.stringify(activePipelines))
	activePipelines.forEach(function(msg){
		current_child.send(msg)
	})
}

var listeners = []
var idCounter = 1
makeWorker()

server.on('connection', function (c){

	c.on('error', function(e){
		console.log('socket error: ' + e)
		clean()
	})
	c.on('close', clean)
	c.on('end', clean)

	function clean(){
		console.log('cleaning up active pipelines for connection: '+myActivePipelines.length)
		myActivePipelines.forEach(function(p){
			activePipelines.splice(activePipelines.indexOf(p),1)
		})
		myActivePipelines = []
	}

	var senderId = ++idCounter

	var myActivePipelines = []

	listeners.push(function(msg){
		if(msg.sender === senderId){
			c.write(msg)
		}
	})
	c.on('data', function(data){
		var msg = {sender: senderId, value: data}
		if(data.type === 'create-pipeline'){
			myActivePipelines.push(msg)
			activePipelines.push(msg)
		}
		current_child.send(msg)
	});
});

server.listen(port)


