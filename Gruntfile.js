module.exports = function(grunt) {
  grunt.initConfig({

    pkg: grunt.file.readJSON( 'package.json' ),
    
    sass: {
      dist: {
        options: {
          style: 'compact'
        },
        files: {
          'example/stylesheets/steps.css': 'src/sass/steps.scss'
        }
      }
    },

    copy: {
      example_js: {
        files: [{
          cwd: "bower_components/",
          expand: true,
          src: ["jquery/dist/jquery.min.js", "handlebars/handlebars.min.js"],
          dest: "example/js/"
        },
        {
          src: "src/js/steps.js",
          dest: "example/js/steps.js"
        }]
      },
      index: {
        files: [{
          src: "src/index.html",
          dest: "example/index.html"
        }]
      },
      dist: {
        files: [{
          src: "src/js/steps.js",
          dest: "dist/steps.js"
        },
        {
          src: "example/stylesheets/steps.css",
          dest: "dist/steps.css"
        }]
      }
    },

    uglify: { 
      options: {
        sourceMap: true,
        preserveComments: false,
        mangle: true,
        report: "min"
      },
      build: {
        src: 'src/js/steps.js',
        dest: 'dist/steps.min.js'
      }
    },

    qunit: {
      all: ['tests/index.html']
    },

    jshint: {
      src: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: ['src/js/**/*.js']
      }
    },

    connect: {
      server: {
        options: {
          port: 8000,
          keepalive: true,
          base: 'example/',
          open: true
        }
      }
    },

    watch: {
      setup: {
        files: ['src/sass/*.scss', 
                'src/js/templates/**/*.hbs', 
                'src/js/**/*.js',
                'src/**/*.html'],

        tasks: ['sass', 'uglify', 'copy', 'jshint']
      }
    },
    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        updateConfigs: [],
        commit: true,
        commitMessage: 'Release %VERSION%',
        commitFiles: ['-a'],
        createTag: true,
        tagName: '%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin master',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
        globalReplace: false
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('default', ['sass', 'uglify', 'copy']);

  grunt.registerTask('bumpit', ['bump']);
};
