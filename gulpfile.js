'use strict';

/* пути к исходным файлам (src), к готовым файлам (build), а также к тем, за изменениями которых нужно наблюдать (watch) */
let path = {
    build: {
        html: 'assets/build/',
        js: 'assets/build/js/',
        styles: 'assets/build/css/',
        img: 'assets/build/img/',
        fonts: 'assets/build/fonts/',
        favicon: 'assets/build/img/favicon/'
    },
    src: {
        html: 'assets/src/views/**/*.html',
        js: 'assets/src/js/main.js',
        styles: 'assets/src/styles/main.scss',
        img: 'assets/src/img/**/*.*',
        fonts: 'assets/src/fonts/**/*.*',
        favicon: 'assets/src/img/favicon/*.*'
    },
    watch: {
        html: 'assets/src/**/*.html',
        js: 'assets/src/**/*.js',
        styles: 'assets/src/**/*.scss',
        img: 'assets/src/img/**/*.*',
        fonts: 'assets/srs/fonts/**/*.*',
        favicon: 'assets/src/img/favicon/*.*'
    },
    clean: './assets/build/*'
};

/* настройки сервера */
let config = {
    server: {
        baseDir: './assets/build/'
    },
    // notify: false / отключает уведомления browser-sync
    /*tunnel: true,
    host: 'localhost',
    port: 9000,
    logPrefix: "FullStack"*/
};

/* подключаем gulp и плагины */
let gulp = require('gulp'), // подключаем Gulp
    webserver = require('browser-sync'), // сервер для работы и автоматического обновления страниц
    plumber = require('gulp-plumber'), // модуль для отслеживания ошибок
    rigger = require('gulp-rigger'), // модуль для импорта содержимого одного файла в другой
    sourcemaps = require('gulp-sourcemaps'), // модуль для генерации карты исходных файлов
    sass = require('gulp-sass'), // модуль для компиляции SASS (SCSS) в CSS
    autoprefixer = require('gulp-autoprefixer'), // модуль для автоматической установки автопрефиксов
    cleanCSS = require('gulp-clean-css'), // плагин для минимизации CSS
    uglify = require('gulp-uglify'), // модуль для минимизации JavaScript
    cache = require('gulp-cache'), // модуль для кэширования
    imagemin = require('gulp-imagemin'), // плагин для сжатия PNG, JPEG, GIF и SVG изображений
    jpegrecompress = require('imagemin-jpeg-recompress'), // плагин для сжатия jpeg	
    pngquant = require('imagemin-pngquant'), // плагин для сжатия png
    rimraf = require('gulp-rimraf'), // плагин для удаления файлов и каталогов
    rename = require('gulp-rename'),
    favicons = require('favicons').stream,
    gulpif = require('gulp-if'),
    htmlmin = require('gulp-htmlmin');

/* задачи */

// запуск сервера
gulp.task('webserver', function () {
    webserver(config);
});

// Продакшн
let runBuild = false;
let mapsBuild = true;

// сбор html
gulp.task('html:build', function () {
    return gulp.src(path.src.html) // выбор всех html файлов по указанному пути
        .pipe(plumber()) // отслеживание ошибок
        .pipe(rigger()) // импорт вложений
        .pipe(gulpif(runBuild, htmlmin({collapseWhitespace: true})))
        .pipe(gulp.dest(path.build.html)) // выкладывание готовых файлов
        .pipe(webserver.reload({stream: true})); // перезагрузка сервера
});

// сбор css
gulp.task('styles:build', function () {
    return gulp.src(path.src.styles) // получим main.scss
        .pipe(plumber()) // для отслеживания ошибок
        .pipe(gulpif(mapsBuild, sourcemaps.init())) // инициализируем sourcemap
        .pipe(sass()) // scss -> css
        .pipe(autoprefixer()) // добавим префиксы
        .pipe(rename({suffix: '.min'}))
        .pipe(gulpif(runBuild, cleanCSS())) // минимизируем CSS
        .pipe(gulpif(mapsBuild, sourcemaps.write())) // записываем sourcemap
        .pipe(gulp.dest(path.build.styles)) // выгружаем в build
        .pipe(webserver.reload({stream: true})); // перезагрузим сервер
});

// сбор js
gulp.task('js:build', function () {
    return gulp.src(path.src.js) // получим файл main.js
        .pipe(plumber()) // для отслеживания ошибок
        .pipe(rigger()) // импортируем все указанные файлы в main.js
        .pipe(gulp.dest(path.build.js))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulpif(mapsBuild, sourcemaps.init())) //инициализируем sourcemap
        .pipe(gulpif(runBuild, uglify())) // минимизируем js
        .pipe(gulpif(mapsBuild, sourcemaps.write())) //  записываем sourcemap
        .pipe(gulp.dest(path.build.js)) // положим готовый файл
        .pipe(webserver.reload({stream: true})); // перезагрузим сервер
});

// перенос шрифтов
gulp.task('fonts:build', function () {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
});

// обработка картинок
gulp.task('image:build', function () {
    return gulp.src(path.src.img) // путь с исходниками картинок
        .pipe(cache(imagemin([ // сжатие изображений
            imagemin.gifsicle({interlaced: true}),
            jpegrecompress({
                progressive: true,
                max: 90,
                min: 80
            }),
            pngquant(),
            imagemin.svgo({plugins: [{removeViewBox: false}]})
        ])))
        .pipe(gulp.dest(path.build.img)); // выгрузка готовых файлов
});

// Генерация фавиконок
gulp.task('favicons:build', function () {
    return gulp.src(path.src.favicon)
        .pipe(favicons({
            icons: {
                appleIcon: true,
                favicons: true,
                online: false,
                appleStartup: false,
                android: false,
                firefox: false,
                yandex: false,
                windows: false,
                coast: false
            }
        }))
        .pipe(gulp.dest(path.build.favicon))
});

// удаление каталога build 
gulp.task('clean:build', function () {
    return gulp.src(path.clean, {read: false})
        .pipe(rimraf());
});

// очистка кэша
gulp.task('cache:clear', function () {
    cache.clearAll();
});

// сборка
gulp.task('build',
    gulp.series('clean:build',
        gulp.parallel(
            'html:build',
            'styles:build',
            'js:build',
            'fonts:build',
            'image:build',
            'favicons:build'
        )
    )
);

// запуск задач при изменении файлов
gulp.task('watch', function () {
    gulp.watch(path.watch.html, gulp.series('html:build'));
    gulp.watch(path.watch.styles, gulp.series('styles:build'));
    gulp.watch(path.watch.js, gulp.series('js:build'));
    gulp.watch(path.watch.img, gulp.series('image:build'));
    gulp.watch(path.watch.favicon, gulp.series('favicons:build'));
    gulp.watch(path.watch.fonts, gulp.series('fonts:build'));
});

// задача по умолчанию
gulp.task('default', gulp.series(
    'build',
    gulp.parallel('webserver', 'watch')
));