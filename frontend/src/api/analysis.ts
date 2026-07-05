import request from './request';

export function getTopPages(limit: number = 20, days: number = 7) {
  return request.get('/analysis/top-pages', { params: { limit, days } });
}

export function getTerminalDist(days: number = 7) {
  return request.get('/analysis/distribution/terminal', { params: { days } });
}

export function getBrowserDist(days: number = 7) {
  return request.get('/analysis/distribution/browser', { params: { days } });
}

export function getTopKeywords(limit: number = 10, days: number = 7) {
  return request.get('/analysis/top-keywords', { params: { limit, days } });
}

export function getBounceRates(limit: number = 10, days: number = 7) {
  return request.get('/analysis/bounce-rates', { params: { limit, days } });
}

export function getRetentionData(days: number = 14) {
  return request.get('/analysis/retention', { params: { days } });
}

export function getOsDist(days: number = 7) {
  return request.get('/analysis/distribution/os', { params: { days } });
}

export function getSessionDistribution(days: number = 7) {
  return request.get('/analysis/session-distribution', { params: { days } });
}