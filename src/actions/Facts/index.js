import { SERVICES } from '../../services/Facts';
import { ResponseHandler } from '../shared';

const methods = {
  loadFacts(pipelinekeys, callback) {
    SERVICES.loadFacts(pipelinekeys, (error, response, body) => ResponseHandler(error, response, body, callback));
  },
};

module.exports = {
  methods: {FACTS: methods}
};