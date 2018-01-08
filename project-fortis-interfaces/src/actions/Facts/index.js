import { SERVICES } from '../../services/Facts';
import { ResponseHandler } from '../shared';

const _methods = {
  loadFacts(pipelinekeys, mainTerm, fromDate, toDate, callback) {
    SERVICES.loadFacts(
      pipelinekeys, mainTerm, fromDate, toDate,
      (error, response, body) => ResponseHandler(error, response, body, callback));
  },
};

const methods = { FACTS: _methods };

module.exports = {
  methods
};
