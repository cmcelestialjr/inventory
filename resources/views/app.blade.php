<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Cdev</title>
        
        <link rel="icon" type="image/png" href="{{ asset('images/clstldev2-removebg.png') }}">

        @viteReactRefresh
        @vite(['resources/css/app.css','resources/js/app.jsx'])
        
    </head>
    <body class="text-blueGray-700 antialiased">
        <div id="app"></div>
    </body>
</html>
