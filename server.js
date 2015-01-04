
//var NLP = require('stanford-corenlp');

var jot = require('json-over-tcp');
/*
function createPipeline(annotators, cb){
	console.log('creating pipeline: ' + JSON.stringify(annotators))
	var coreNLP = new NLP.StanfordNLP({nlpPath:"./../stanford-corenlp-full-2014-10-31",version:"3.5.0",annotators: annotators},function(err) {
		if(err){
			cb(err)
		}else{
			cb(undefined, coreNLP)
		}
	});
}
*/
var port = 8099
var server = jot.createServer(port);

var child_process = require('child_process')
var current_child
function makeWorker(){
	if(current_child){
		current_child.kill()
	}
	current_child = child_process.fork('./worker')//, [args], [options])#
}
makeWorker()
var idCounter = 1
server.on('connection', function (c){
	var openPipeline
	var openPipelineKey
	var configByKey = {}
	var openPipelineIdMap = {}
	c.on('error', function(e){
		console.log('socket error: ' + e)
	})

	var senderId = ++idCounter

	current_child.on('message', function(msg){
		if(msg.sender === senderId){
			c.write(msg)
		}
	})
	c.on('data', function(data){

		//var id = ++idCounter
		current_child.send({sender: senderId, value: data})
		
		/*if(data.type === 'create-pipeline'){
			var key = JSON.stringify(data.annotators)
			openPipelineIdMap[data.req] = key
			if(openPipelineKey === key){
				c.write({type: 'pipeline-created', req: data.req, id: data.req})
			}else{
				openPipelineKey = key
				configByKey[key] = data.annotators
				openPipeline = undefined
				createPipeline(data.annotators, function(err, core){
					if(err){
						console.log('Error making pipeline: ' + err)
						c.write({type: 'error', errcode: 'pipeline-creation-error', req: data.req, err: err})
						return
					}
					openPipeline = core//s[data.req] = core
					c.write({type: 'pipeline-created', req: data.req, id: data.req})
				})
			}
		}else if(data.type === 'process'){
			var pipelineKey = openPipelineIdMap[data.pipeline]
			if(pipelineKey !== openPipelineKey){
				//reload desired pipeline
				createPipeline(configByKey[pipelineKey], function(err, core){
					if(err){
						console.log('Error re-making pipeline: ' + err)
						c.write({type: 'error', errcode: 'pipeline-re-creation-error', req: data.req, err: err})
					}else{
						openPipeline = core
						openPipelineKey = pipelineKey
						doProcess(core)
					}
				})
				return
			}
			var pipeline = openPipeline//openPipelines[data.pipeline]
			if(!pipeline){
				console.log('unknown pipeline error: ' + data.pipeline)
				c.write({type: 'error', errcode: 'unknown-pipeline', err: 'Uknown pipeline: ' + data.pipeline})
				return
			}
			doProcess(pipeline)
			function doProcess(pipeline){
				pipeline.process(data.text, function(err, result){
					if(err){
						console.log('Error in process: ' + err)
						c.write({type: 'error', errcode: 'process-failed', err: err})
						return
					}
					c.write({type: 'process-result', req: data.req, result: result})
				})
			}
		}else{
			console.log('unknown request type: ' + data.type)
		}*/
	});
});

server.listen(port)


