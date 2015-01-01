
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
	var openPipelines = {}
	c.on('data', function(data){
		if(data.type === 'create-pipeline'){
			createPipeline(data.annotators, function(err, core){
				if(err){
					socket.write({type: 'error', errcode: 'pipeline-creation-error', req: data.req, err: err})
					return
				}
				openPipelines[data.req] = core
				socket.write({type: 'pipeline-created', req: data.req, id: data.req})
			})
		}else if(data.type === 'process'){
			var pipeline = openPipelines[data.pipeline]
			if(!pipeline){
				socket.write({type: 'error', errcode: 'unknown-pipeline', err: 'Uknown pipeline: ' + data.pipeline})
				return
			}
			pipeline.process(data.text, function(err, result){
				if(err){
					socket.write({type: 'error', errcode: 'process-failed', err: err})
					return
				}
				socket.write({type: 'process-result', req: data.req, result: result})
			})
		}else if(data.type === 'destroy-pipeline'){
			var pipeline = openPipelines[data.pipeline]
			if(!pipeline){
				socket.write({type: 'error', errcode: 'unknown-pipeline', err: 'Uknown pipeline: ' + data.pipeline})
				return
			}
			delete openPipelines[data.pipeline]
			socket.write({type: 'pipeline-destroyed', req: data.req, pipeline: data.pipeline})
		}else{
			console.log('unknown request type: ' + data.type)
		}
	});
});

