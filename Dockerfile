FROM lfdoherty/corenlp-and-node
MAINTAINER Liam Doherty <lfdoherty@gmail.com>
RUN git clone https://github.com/lfdoherty/node-corenlp-manager-server.git && cd node-corenlp-manager-server && npm install