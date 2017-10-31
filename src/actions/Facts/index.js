import { SERVICES } from '../../services/Facts';
import { ResponseHandler } from '../shared';

const methods = {
  loadFacts(pipelinekeys, mainTerm, fromDate, toDate, callback) {
    SERVICES.loadFacts(
      pipelinekeys, mainTerm, fromDate, toDate,
      (error, response, body) => ResponseHandler(error, response, body, callback));
  },
};

module.exports = {
  methods: {FACTS: methods}
};