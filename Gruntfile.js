module.exports = function(grunt) {
  grunt.initConfig({

    pkg: grunt.file.readJSON( 'package.json' ),
    
    sass: {
      dist: {
        options: {
          style: 'compact'
        },
        files: {
          'build/assets/stylesheets/steps.css': 'src/sass/steps.scss'
        }
      }
    },

    copy: {
      js: {
        files: [{
          cwd: "src/js/bower_components/",
          expand: true,
          src: ["**/*"],
          dest: "build/assets/js/vendor/"
        }]
      }
    },

    /*
    concat: {
      app: {
        src: ['src/js/template.js', 'src/js/steps.js'],

        dest: 'src/js/steps.all.js'
      }
    },*/

    uglify: { 
      options: {
        sourceMap: true,
        preserveComments: false,
        mangle: false,
        report: "min"
      },
      build: {
        src: 'src/js/steps.js',
        dest: 'build/assets/js/steps.min.js'
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
        src: ['src/js/**/*.js']
      }
    },

    watch: {
      setup: {
        files: ['src/sass/*.scss', 
                'src/js/templates/**/*.hbs', 
                'src/js/**/*.js'],

        tasks: ['sass',
                //'concat',
                'uglify',
                //-'qunit',
                'jshint']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['sass', 'copy', 'uglify', 'watch']);
};
