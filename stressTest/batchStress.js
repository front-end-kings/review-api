import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 30 }, // simulate ramp-up of traffic from 1 to 60 users over 5 minutes.
    { duration: '5m', target: 60 }, // stay at 60 users for 10 minutes
    { duration: '3m', target: 80 }, // ramp-up to 100 users over 3 minutes (peak hour starts)
    { duration: '2m', target: 80 }, // stay at 100 users for short amount of time (peak hour)
    { duration: '3m', target: 60 }, // ramp-down to 60 users over 3 minutes (peak hour ends)
    { duration: '3m', target: 60 }, // continue at 60 for additional 10 minutes
    { duration: '5m', target: 0 }, // ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 99% of requests must complete below 5s
  },
};

export default function () {
  const url = `http://localhost:3000`;
  const rnd = Math.floor(Math.random() * 950063);
  const sort = ['helpful', 'newest', 'relevant'];
  const randomOption = sort[Math.floor(Math.random() * sort.length)];
  let responses = http.batch([
    [
      'GET',
      `${url}/reviews/?product_id=${rnd}&sort='${randomOption}'/`,
      null,
      { tags: {} },
    ],
    [
      'GET',
      `${url}/reviews/meta?product_id=${rnd}/`,
      null,
      {tags: {} },
    ]
  ]);

  sleep(1);
}
