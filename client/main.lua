local QBCore = exports['qb-core']:GetCoreObject()

local targetZoneIds = {}

local function RefreshFoodOrderTargets()
    -- Remove previous zones if any
    for i, zoneId in ipairs(targetZoneIds) do
        exports['qb-target']:RemoveZone(zoneId)
    end
    targetZoneIds = {}

    local PlayerData = QBCore.Functions.GetPlayerData()
    local options = {
        { icon = "fas fa-utensils", label = "Order Food", action = function() TriggerEvent('qb-foodorder:client:openMenu') end }
    }
    if PlayerData and PlayerData.job and PlayerData.job.name == Config.JobName then
        table.insert(options, { icon = "fas fa-list", label = "Order List", action = function() TriggerEvent('qb-foodorder:client:openOrderList') end })
    end

    for i, coords in ipairs(Config.Targets) do
        local zoneId = "food_order_tablet_" .. i
        exports['qb-target']:AddBoxZone(
            zoneId,
            vector3(coords.x, coords.y, coords.z),
            1.5, 1.5,
            {
                name = zoneId,
                heading = coords.w or coords[4],
                debugPoly = false,
                minZ = coords.z - 1,
                maxZ = coords.z + 1,
            },
            {
                options = options,
                distance = 2.5
            }
        )
        table.insert(targetZoneIds, zoneId)
    end
end

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    Wait(500) -- ensure job data is loaded
    RefreshFoodOrderTargets()
end)

RegisterNetEvent('QBCore:Client:OnJobUpdate', function(job)
    Wait(250)
    RefreshFoodOrderTargets()
end)

CreateThread(function()
    while not QBCore do Wait(50) end
    RefreshFoodOrderTargets()
end)

RegisterNetEvent('qb-foodorder:client:openMenu', function()
    SetNuiFocus(true, true)
    SendNUIMessage({ type = "setSoundConfig", enabled = Config.EnableSound })
    SendNUIMessage({ type = "setTotalColor", color = Config.TotalColor })
    SendNUIMessage({ type = "openMenu", items = Config.FoodItems })
end)

RegisterNUICallback("escape", function(_, cb)
    SetNuiFocus(false, false)
    SendNUIMessage({ type = "closeMenu" })
    cb("ok")
end)

RegisterNUICallback("notify", function(data, cb)
    local msgType = data.type or "primary"
    local msgText = data.text or "Notification"
    TriggerEvent("QBCore:Notify", msgText, msgType)
    cb("ok")
end)

RegisterNUICallback("checkout", function(data, cb)
    local hasItems = false
    for _, item in pairs(data) do
        if item.qty and item.qty > 0 then
            hasItems = true
            break
        end
    end

    if not hasItems then
        TriggerEvent("QBCore:Notify", "Add items to cart before placing an order!", "error")
        cb("fail")
        return
    end

    TriggerServerEvent("qb-foodorder:server:createOrder", data)
    TriggerEvent("QBCore:Notify", "Order placed successfully!", "success")
    SetNuiFocus(false, false)
    SendNUIMessage({ type = "closeMenu" })
    cb("ok")
end)

RegisterNetEvent('qb-foodorder:client:showOrders', function(orders)
    SetNuiFocus(true, true)
    SetNuiFocusKeepInput(false) -- Ensure other controls are not blocked
    SendNUIMessage({ type = "openOrders", orders = orders })
end)

RegisterNUICallback("escapeOrders", function(_, cb)
    SetNuiFocus(false, false)
    SetNuiFocusKeepInput(false)
    SendNUIMessage({ type = "closeOrders" })
    cb("ok")
end)

RegisterNetEvent('qb-foodorder:client:openOrderList', function()
    local PlayerData = QBCore.Functions.GetPlayerData()
    if PlayerData and PlayerData.job and PlayerData.job.name == Config.JobName then
        SetNuiFocus(true, true)
        TriggerServerEvent('qb-foodorder:server:getOrderList')
    else
        TriggerEvent("QBCore:Notify", "You are not authorized to view the order list!", "error")
    end
end)

RegisterNetEvent('qb-foodorder:client:showStaffList', function(staff)
    SendNUIMessage({ type = 'showStaffList', staff = staff })
end)

RegisterNetEvent('qb-foodorder:client:showOrderList', function(orders)
    SendNUIMessage({ type = "openOrderList", orders = orders })
end)

RegisterNUICallback("escapeOrderList", function(_, cb)
    SetNuiFocus(false, false)
    SetNuiFocusKeepInput(false)
    cb("ok")
end)

RegisterNUICallback('deleteOrder', function(data, cb)
    TriggerServerEvent('qb-foodorder:server:deleteOrder', data.order)
    cb({ success = true })
end)

RegisterNUICallback('requestStaffList', function(_, cb)
    TriggerServerEvent('qb-foodorder:server:requestStaffList')
    cb('ok')
end)