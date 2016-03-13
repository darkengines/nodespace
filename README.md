# nodespace

#####./components/dependency.js
```
require('nodespace');

nodespace.register({
  name: 'dependency',
  require: [],
  initialize(nodespace, exports, callback) {
    //initialize dependency
  }
});
```

#####./components/user.js
```
require('nodespace');

nodespace.register({
  name: 'user',
  require: ['dependency'],
  initialize(nodespace, exports, callback) {
    //dependency module is initialized
    var dependency = nodespace.dependency;
    //do what you want with dependency
  }
});
```

#####./application.js

```
require('nodespace');

nodespace.initialize('./components', require, function(context) {
  //all modules are resolved
  var user = context.nodespace.user;
});
```
