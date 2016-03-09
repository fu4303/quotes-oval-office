var dist, ghpages, handle_error, options, path;
ghpages = require('gh-pages');
path = require('path');

handle_error = function(error) {
  if (error) {
    console.error(error);
    return process.exit(Number(error.errno) || 1);
  }
};

dist = path.join(__dirname, '..', 'dist');

options = {
  logger: console.log,
  dotfiles: true,
  message: 'Update gh-pages [ci skip]',
  user: {
    name: 'Deploy Bot',
    email: 'deploy+bot@mydomain.com'
  }
};

ghpages.publish(dist, options, handle_error);
