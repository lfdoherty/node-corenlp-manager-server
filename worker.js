
var NLP = require('stanford-corenlp');

//var jot = require('json-over-tcp');

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

var expectingEnd = false
process.on('message', function(m) {
	var data = m.value

	if(!expectingEnd && process.memoryUsage().heapUsed > 3*1024*1024*1024){
		expectingEnd = true
		process.send({type: 'please-end'})
	}

	if(data.type === 'create-pipeline'){
		var key = JSON.stringify(data.annotators)
		openPipelineIdMap[data.req] = key
		if(openPipelineKey === key){
			process.send({sender: m.sender, type: 'pipeline-created', req: data.req, id: data.req})
		}else{
			openPipelineKey = key
			configByKey[key] = data.annotators
			openPipeline = undefined
			createPipeline(data.annotators, function(err, core){
				if(err){
					console.log('Error making pipeline: ' + err)
					process.send({sender: m.sender, type: 'error', errcode: 'pipeline-creation-error', req: data.req, err: err})
					return
				}
				openPipeline = core//s[data.req] = core
				process.send({sender: m.sender, type: 'pipeline-created', req: data.req, id: data.req})
			})
		}
	}else if(data.type === 'process'){
		var pipelineKey = openPipelineIdMap[data.pipeline]
		if(pipelineKey !== openPipelineKey){
			//reload desired pipeline
			createPipeline(configByKey[pipelineKey], function(err, core){
				if(err){
					console.log('Error re-making pipeline: ' + err)
					process.send({sender: m.sender, type: 'error', errcode: 'pipeline-re-creation-error', req: data.req, err: err})
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
			process.send({sender: m.sender, type: 'error', errcode: 'unknown-pipeline', err: 'Uknown pipeline: ' + data.pipeline})
			return
		}
		doProcess(pipeline)
		function doProcess(pipeline){
			pipeline.process(data.text, function(err, result){
				if(err){
					console.log('Error in process: ' + err)
					process.send({sender: m.sender, type: 'error', errcode: 'process-failed', err: err})
					return
				}
				process.send({sender: m.sender, type: 'process-result', req: data.req, result: result})
			})
		}
	}else{
		console.log('unknown request type: ' + data.type)
	}
});

//process.send({ foo: 'bar' });
/*
var port = 8199
var server = jot.createServer(port);

server.on('connection', function (c){
	var openPipeline
	var openPipelineKey
	var configByKey = {}
	var openPipelineIdMap = {}
	c.on('error', function(e){
		console.log('socket error: ' + e)
	})
	c.on('data', function(data){
		if(data.type === 'create-pipeline'){
			var key = JSON.stringify(data.annotators)
			openPipelineIdMap[data.req] = key
			if(openPipelineKey === key){
				process.send({type: 'pipeline-created', req: data.req, id: data.req})
			}else{
				openPipelineKey = key
				configByKey[key] = data.annotators
				openPipeline = undefined
				createPipeline(data.annotators, function(err, core){
					if(err){
						console.log('Error making pipeline: ' + err)
						process.send({type: 'error', errcode: 'pipeline-creation-error', req: data.req, err: err})
						return
					}
					openPipeline = core//s[data.req] = core
					process.send({type: 'pipeline-created', req: data.req, id: data.req})
				})
			}
		}else if(data.type === 'process'){
			var pipelineKey = openPipelineIdMap[data.pipeline]
			if(pipelineKey !== openPipelineKey){
				//reload desired pipeline
				createPipeline(configByKey[pipelineKey], function(err, core){
					if(err){
						console.log('Error re-making pipeline: ' + err)
						process.send({type: 'error', errcode: 'pipeline-re-creation-error', req: data.req, err: err})
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
				process.send({type: 'error', errcode: 'unknown-pipeline', err: 'Uknown pipeline: ' + data.pipeline})
				return
			}
			doProcess(pipeline)
			function doProcess(pipeline){
				pipeline.process(data.text, function(err, result){
					if(err){
						console.log('Error in process: ' + err)
						process.send({type: 'error', errcode: 'process-failed', err: err})
						return
					}
					process.send({type: 'process-result', req: data.req, result: result})
				})
			}
		}else{
			console.log('unknown request type: ' + data.type)
		}
	});
});

server.listen(port)

*/
