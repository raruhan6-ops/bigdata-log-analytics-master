import request from './request';

export interface DrilldownParams {
  days?: number;
  url_path?: string;
  terminal?: string;
  browser?: string;
  status_code?: number;
  keyword?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

export function drilldownQuery(params: DrilldownParams = {}) {
  return request.get('/drilldown/query', { params });
}
