const url = 'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc';
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1NTc1M2JmMTI5MDE3NGQxMTU3YWI2OWVmNzZmMmUxZSIsIm5iZiI6MTc0NDgxMjg5OS41MzksInN1YiI6IjY3ZmZiYjYzZGU1ZTRkZWM2MmFlYzAyNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.KU5LMq6-iDDwrKToWctvyt21-92gDDE9eI7R682KGd0'
  }
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error(err));