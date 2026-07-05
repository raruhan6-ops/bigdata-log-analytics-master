import request from './request';

export function getSchedulerJobs() {
  return request.get('/scheduler/jobs');
}

export function getJobLogs(jobId: string) {
  return request.get(`/scheduler/jobs/${jobId}/logs`);
}
