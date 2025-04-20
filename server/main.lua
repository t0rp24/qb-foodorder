local QBCore = exports['qb-core']:GetCoreObject()
local orderId = 0

RegisterServerEvent("qb-foodorder:server:createOrder", function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    orderId = orderId + 1
    local orderNumber = string.format("%04d", orderId)

    local itemInfo = {}
    local itemsForDb = {}
    local totalPrice = 0
    for name, item in pairs(data) do
        if item.qty > 0 then
            table.insert(itemInfo, name .. " x" .. item.qty)
            table.insert(itemsForDb, {label = name, qty = item.qty, price = item.price})
            totalPrice = totalPrice + (item.price * item.qty)
        end
    end

    local timestamp = os.date("%A, %d-%m-%Y %H:%M:%S")

    local charinfo = Player.PlayerData.charinfo or {}
    local name = (charinfo.firstname or Player.PlayerData.name or "")
    if charinfo.lastname then
        name = name .. " " .. charinfo.lastname
    end
    local metadata = {
        order = orderNumber,
        items = table.concat(itemInfo, ", "),
        time = timestamp,
        name = name
    }

    local success = Player.Functions.AddItem("order_bill", 1, false, metadata)
    print("[FoodOrder] Gave bill to", Player.PlayerData.name, success and "✅ Success" or "❌ Failed")
    TriggerClientEvent("inventory:client:ItemBox", src, QBCore.Shared.Items["order_bill"], "add")

    -- Insert order into DB for order list panel
    MySQL.Async.execute("INSERT INTO food_orders (citizenid, items, order_no, total_price, customer_name) VALUES (?, ?, ?, ?, ?)", {
        Player.PlayerData.citizenid,
        json.encode(itemsForDb),
        orderNumber,
        totalPrice,
        name
    })
end)

RegisterNetEvent("qb-foodorder:server:fetchOrders", function()
    local src = source
    local QBCore = exports['qb-core']:GetCoreObject()
    local orders = {}
    local result = MySQL.Sync.fetchAll("SELECT order_no, items, timestamp FROM food_orders ORDER BY id DESC LIMIT 50")
    for _, row in ipairs(result) do
        table.insert(orders, {
            order = row.order_no,
            items = row.items,
            time = row.timestamp
        })
    end
    TriggerClientEvent("qb-foodorder:client:showOrders", src, orders)
end)

RegisterNetEvent('qb-foodorder:server:getOrderList', function()
    local src = source
    local orders = {}
    local result = MySQL.Sync.fetchAll("SELECT order_no, items, total_price, customer_name FROM food_orders ORDER BY id DESC LIMIT 50")
    for _, row in ipairs(result) do
        local itemsTable = json.decode(row.items)
        table.insert(orders, {
            order = row.order_no,
            items = itemsTable,
            total = row.total_price,
            customer_name = row.customer_name
        })
    end
    TriggerClientEvent('qb-foodorder:client:showOrderList', src, orders)
end)

RegisterNetEvent('qb-foodorder:server:deleteOrder', function(orderNo)
    MySQL.Async.execute('DELETE FROM food_orders WHERE order_no = ?', { orderNo })
end)

RegisterNetEvent('qb-foodorder:server:requestStaffList', function()
    local src = source
    local staff = {}
    local jobName = (Config and Config.JobName) or 'burger'
    print('[FoodOrder] Staff request received. Config.JobName:', jobName)

    -- Get all characters who have ever had the job (offline and online)
    local result = MySQL.Sync.fetchAll("SELECT charinfo, job FROM players WHERE JSON_EXTRACT(job, '$.name') = ?", {jobName})
    local allMembers = {}
    for _, row in ipairs(result) do
        local charinfo = json.decode(row.charinfo)
        local job = json.decode(row.job)
        local name = charinfo.firstname or row.citizenid or 'Unknown'
        if charinfo.lastname then name = name .. ' ' .. charinfo.lastname end
        local rank = job.grade and (job.grade.name or tostring(job.grade)) or 'Employee'
        allMembers[name] = { name = name, rank = rank, online = false }
    end

    -- Mark online staff
    for _, player in pairs(QBCore.Functions.GetPlayers()) do
        local ply = QBCore.Functions.GetPlayer(player)
        if ply and ply.PlayerData.job and ply.PlayerData.job.name == jobName then
            local name = ply.PlayerData.charinfo and ply.PlayerData.charinfo.firstname or ply.PlayerData.name or 'Unknown'
            if ply.PlayerData.charinfo and ply.PlayerData.charinfo.lastname then
                name = name .. ' ' .. ply.PlayerData.charinfo.lastname
            end
            local rank = ply.PlayerData.job.grade and (ply.PlayerData.job.grade.name or tostring(ply.PlayerData.job.grade)) or 'Employee'
            allMembers[name] = { name = name, rank = rank, online = true }
        end
    end

    -- Convert to list
    for _, member in pairs(allMembers) do
        table.insert(staff, member)
    end

    print('[FoodOrder] Sending staff list:', json.encode(staff))
    TriggerClientEvent('qb-foodorder:client:showStaffList', src, staff)
end)

RegisterNetEvent('qb-foodorder:client:showStaffList', function(staff)
    SendNUIMessage({ type = 'showStaffList', staff = staff })
end)
