fx_version 'cerulean'
game 'gta5'

description 'Self-Ordering Food System - QBCore'
author 'you'
version '1.0.0'

shared_scripts {
    '@qb-core/shared/locale.lua',
    'config.lua'
}

client_scripts {
    'client/main.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/main.lua'
}

ui_page {
    'html/index.html'
}


files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/images/*.png',
    'html/staff.html',
    'html/staff.js',
    'html/orders.html',
    'html/orders.js',
    'html/click.mp3',
}
