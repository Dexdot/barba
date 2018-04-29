var gulp = require('gulp'),
  sass = require('gulp-sass'),
  browserSync = require('browser-sync'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  cleanCSS = require('gulp-clean-css'),
  rename = require('gulp-rename'),
  del = require('del'),
  notify = require('gulp-notify'),
  svgmin = require('gulp-svgmin'),
  svgstore = require('gulp-svgstore'),
  postcss = require('gulp-postcss'),
  autoprefixer = require('autoprefixer'),
  mqpacker = require('css-mqpacker'),
  plumber = require('gulp-plumber'),
  webpack = require('webpack'),
  webpackStream = require('webpack-stream');

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      host: '192.168.1.108',
      baseDir: 'app'
    },
    notify: false
  });
});

gulp.task('js', function() {
  return gulp
    .src('./app/js/app.js')
    .pipe(plumber())
    .pipe(
      webpackStream({
        output: {
          filename: 'bundle.js'
        },
        module: {
          rules: [
            {
              test: /\.(js)$/,
              exclude: /(node_modules)/,
              loader: 'babel-loader',
              query: {
                presets: [
                  [
                    'env',
                    {
                      targets: {
                        browsers: ['last 2 versions', 'ie >= 11']
                      }
                    }
                  ]
                ]
              }
            }
          ]
        }
        // Указывает, что jquery у нас подключается внешне и его не надо включать в бандл
        // externals: {
        //   jquery: 'jQuery'
        // }
      })
    )
    .pipe(gulp.dest('./app/js'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('js-min', function() {
  return gulp
    .src('./app/js/app.js')
    .pipe(plumber())
    .pipe(
      webpackStream({
        output: {
          filename: 'bundle.js'
        },
        module: {
          rules: [
            {
              test: /\.(js)$/,
              exclude: /(node_modules)/,
              loader: 'babel-loader',
              query: {
                presets: [
                  [
                    'env',
                    {
                      targets: {
                        browsers: ['last 2 versions', 'ie >= 11']
                      }
                    }
                  ]
                ]
              }
            }
          ]
        }
        // Указывает, что jquery у нас подключается внешне и его не надо включать в бандл
        // externals: {
        //   jquery: 'jQuery'
        // }
      })
    )
    .pipe(gulp.dest('./app/js'))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./app/js'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('sass', function() {
  return gulp
    .src('app/sass/**/*.sass')
    .pipe(
      sass({ outputStyle: 'expand', precision: 5 }).on(
        'error',
        notify.onError()
      )
    )
    .pipe(rename({ suffix: '.min', prefix: '' }))
    .pipe(
      postcss([
        autoprefixer({
          browsers: ['last 3 versions'],
          cascade: false
        }),
        mqpacker()
      ])
    )
    .pipe(cleanCSS())
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('watch', ['sass', 'js', 'browser-sync'], function() {
  gulp.watch('app/sass/**/*.sass', ['sass']);
  gulp.watch(['app/js/**/*.js', '!app/js/bundle.js'], ['js']);
  gulp.watch('app/*.html', browserSync.reload);
});

gulp.task('sprite', function() {
  return gulp
    .src('app/img/svg/*.svg')
    .pipe(plumber())
    .pipe(svgmin())
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('app/img/svg/sprite/'));
});

gulp.task('build', ['removedist', 'sass', 'js-min'], function() {
  var buildFiles = gulp
    .src(['app/*.html', 'app/*.php', 'app/.htaccess'])
    .pipe(gulp.dest('dist'));

  var buildCss = gulp.src(['app/css/main.min.css']).pipe(gulp.dest('dist/css'));

  var buildJs = gulp
    .src(['app/js/bundle.min.js'])
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest('dist/js'));

  var buildFonts = gulp.src(['app/fonts/**/*']).pipe(gulp.dest('dist/fonts'));

  var buildImg = gulp.src(['app/img/**/*']).pipe(gulp.dest('dist/img'));

  var buildMailer = gulp
    .src(['app/libs/phpmailer/*'])
    .pipe(gulp.dest('dist/phpmailer'));
});

gulp.task('removedist', function() {
  return del.sync('dist');
});

gulp.task('default', ['watch']);
