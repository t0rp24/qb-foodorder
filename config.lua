Config = {}

Config.Targets = {
    vector4(-1185.09, -893.43, 14.16, 216.12),
    vector4(-1191.51, -894.26, 14.04, 347.47)
    -- Add more locations below as needed
    -- vector4(x, y, z, heading),
}

-- For backward compatibility, keep the old single Target (optional)
--Config.Target = Config.Targets[2]

Config.EnableSound = true -- false to disable ui sound

Config.TotalColor = "red" -- Options: "red", "blue", "green"

Config.JobName = "burger" -- customizable

Config.FoodItems = {
    { name = "Burger", image = "sandwich.png", price = 5 },
    { name = "Fries", image = "snikkel_candy.png", price = 3 },
    { name = "Cola", image = "cola.png", price = 2 },
    { name = "Pizza", image = "tosti.png", price = 6 },
    { name = "Batatawada", image = "cola.png", price = 2 },
    { name = "Bhaji", image = "tosti.png", price = 6 },
    { name = "Pawbhaji", image = "cola.png", price = 2 },
    { name = "Egg Toast", image = "tosti.png", price = 6 },
    { name = "Dosa", image = "tosti.png", price = 6 },
    { name = "Idli", image = "tosti.png", price = 6 },
    { name = "Wada", image = "tosti.png", price = 6 },
    { name = "Uttapa", image = "tosti.png", price = 6 },
    { name = "Cake", image = "tosti.png", price = 6 },
}