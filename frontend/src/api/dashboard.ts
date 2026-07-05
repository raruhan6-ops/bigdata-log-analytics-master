import request from './request';

export function getOverview() {
  return request.get('/dashboard/overview');
}

export function getTrend(days: number = 7) {
  return request.get('/dashboard/trend', { params: { days } });
}