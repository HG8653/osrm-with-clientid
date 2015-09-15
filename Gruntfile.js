module.exports = function(grunt) {
    grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),
	browserify: {
	    control: {
		src: ['src/L.Routing.OSRMwithCid.js'],
		dest: 'dist/lrm-with-clientid.js',
		options: {
		    browserifyOptions: {
			transform: 'browserify-shim',
			standalone: 'L.Routing'
		    }
		}
	    }
	},
	uglify: {
	    options: {
		banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
		    '<%= grunt.template.today("yyyy-mm-dd") %> */\n\n'
	    },
	    build: {
		src: 'dist/lrm-with-clientid.js',
		dest: 'dist/lrm-with-clientid.min.js'
	    }
	},
	release: {
	    email: 'masanobu@jp.ibm.com',
	    name: 'Masanobu Takagi',
	    tasks: ['default', 'changelog']
	},
	'gh-pages': {
	    options: {
		add: true
	    },
	    src: ['dist/**']
	}
    });
    
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-semantic-release');
    grunt.loadNpmTasks('grunt-gh-pages');
    grunt.registerTask('default', ['browserify', 'uglify']);
};
