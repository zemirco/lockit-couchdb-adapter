
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        expr: true
      },
      files: ['Gruntfile.js', 'index.js', 'test/test.js', 'init.js']
    }
  });

  // load tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // register tasks
  grunt.registerTask('hint', ['jshint']);

};