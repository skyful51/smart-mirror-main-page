import socket
import requests 
ip_address = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
ip_address.connect(("8.8.8.8", 80))

def return_weather_info():
    response = requests.get(url = "https://api.ip2location.com/v2/?ip="+ip_address.getsockname()[0]+"&key=59LQZ8YIAH&package=WS25")

    data = response.json()

    data["latitude"]
    data["longitude"]
    data["city_name"]

    weather_response_current = requests.get(url="https://api.openweathermap.org/data/2.5/weather?lat="+str(data["latitude"])+"&lon="+str(data["longitude"])+"&appid=4ba30de297a5cd3090a995ed997a8fe1&units=metric&lang=kr")
    weather_data_current = weather_response_current.json() 
    
        
    weather_meta_data = []

    weather_meta_data.append(weather_data_current["weather"][0]["icon"])
    weather_meta_data.append(weather_data_current["main"]["temp"]) 
    weather_meta_data.append(weather_data_current["weather"][0]["description"])
    return weather_meta_data 




    