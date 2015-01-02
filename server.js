
var NLP = require('stanford-corenlp');

var jot = require('json-over-tcp');

function createPipeline(annotators, cb){
	var coreNLP = new NLP.StanfordNLP({nlpPath:"./../stanford-corenlp-full-2014-06-16",version:"3.4",annotators: annotators},function(err) {
		if(err){
			cb(err)
		}else{
			cb(undefined, coreNLP)
		}
	});
}

var port = 8099
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
			if(data.pipeline !== openPipelineKey){
				//reload desired pipeline
				createPipeline(configByKey[openPipelineIdMap[data.pipeline]], function(err, core){
					if(err){
						console.log('Error re-making pipeline: ' + err)
						c.write({type: 'error', errcode: 'pipeline-re-creation-error', req: data.req, err: err})
					}else{
						openPipeline = core
						openPipelineKey = openPipelineIdMap[data.pipeline]
						doProcess(core)
					}
				})
				return
			}
			var pipeline = openPipelines[data.pipeline]
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
		}/*else if(data.type === 'destroy-pipeline'){
			var pipeline = openPipelines[data.pipeline]
			if(!pipeline){
				socket.write({type: 'error', errcode: 'unknown-pipeline', err: 'Uknown pipeline: ' + data.pipeline})
				return
			}
			delete openPipelines[data.pipeline]
			socket.write({type: 'pipeline-destroyed', req: data.req, pipeline: data.pipeline})
		}*/else{
			console.log('unknown request type: ' + data.type)
		}
	});
});

server.listen(port)


