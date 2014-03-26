module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON( 'package.json' ),
    
    concat: {
      app: {
        src: ['src/js/libs/jquery-1.10.2.js',
              'src/js/libs/ember-data-1.0.0-beta.7.js',
              'src/js/app/*.js', 
              'src/js/app/**/*.js'],

        dest: 'build/assets/js/app.js'
      }
    },

    qunit: {
        all: {
            options: {
                urls: [
                    'http://localhost:9000/test/index.html'
                ]
            }
        }
    },

    jshint: {
        src: {
            options: {
                jshintrc: '.jshintrc'
            },
            src: ['src/js/app/**/*.js']
        }
    },
    
    watch: {

      concat: {
        files: ['src/js/**/*.js', '!src/js/app.js', '!src/js/libs.js', '!src/js/templates.js'],
        tasks: ['concat']
      },

      qunit: {
        files: ['src/js/app/**/*.js'],
        tasks: ['connect', 'qunit']
      },

      jshint: {
        files: ['src/js/app/**/*.js'],
        tasks: ['jshint']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'watch']);
};
