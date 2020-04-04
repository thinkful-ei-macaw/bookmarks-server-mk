function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Google',
      url: 'https://google.com',
      description: 'Search for stuff',
      rating: 5
    },
    {
      id: 2,
      title: 'Facebook',
      url: 'https://facebook.com',
      description: 'Poke people',
      rating: 4
    },
    {
      id: 3,
      title: 'CSS Legends',
      url: 'https://css-legends.com',
      description: 'Learn CSS by playing a game',
      rating: 5
    }
  ];
}

function randomBookmark() {
  const index = Math.floor(Math.random() * makeBookmarksArray().length);
  return makeBookmarksArray()[index];
}

module.exports = { makeBookmarksArray, randomBookmark };