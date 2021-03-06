import http from 'k6/http';
import { check } from 'k6';

export default function () {
    const rnd = Math.floor(Math.random() * 950063);
    const response = http.put(`http://localhost:3000/reviews/${rnd}/helpful`);
    console.log('Response time was ' + String(response.timings.duration) + 'ms');
    check(response, {
        'is status 204': (r) => r.status === 204,
    });
};

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // below normal load
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 }, // normal load
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 }, // around the breaking point
    { duration: '5m', target: 300 },
    { duration: '2m', target: 400 }, // beyond the breaking point
    { duration: '5m', target: 400 },
    { duration: '10m', target: 0 }, // scale down. Recovery stage.
  ],
};