FROM lfdoherty/corenlp-and-node:v3.5
MAINTAINER Liam Doherty <lfdoherty@gmail.com>
RUN cd app && git clone https://github.com/lfdoherty/node-corenlp-manager-server.git && cd node-corenlp-manager-server && npm install