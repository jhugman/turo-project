module.exports = function (grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: ".jshintrc"
      },

      files: ["lib/**/*.js", "test/test-*.js", "!*.min.js", "Gruntfile.js", "!lib/*generated.js"]
    },

    node_tap: {
      short_tests: {
          options: {
              outputType: 'stats', // tap, failures, stats
              outputTo: 'console' // or file
              //outputFilePath: '/tmp/out.log' // path for output file, only makes sense with outputTo 'file'
          },
          files: {
              'tests': ['./test/test-*.js']
          }
      }
    },
    peg: {
      options: { trackLineAndColumn: true },  
      parser: {
        src: "resources/grammar.pegjs",
        dest: "lib/parser-generated.js"
      }
    },

    watch: {
      files: ['<%= jshint.files %>', 'resources/*.pegjs', 'includes/*.turo'],
      tasks: ['default']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-node-tap');
  grunt.loadNpmTasks('grunt-peg');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask("default", ["jshint", "peg", "node_tap"]);
};