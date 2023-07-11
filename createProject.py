import requests

apiKey = '_wJTOdzV2Txad1f025UtnRYApPvUm0iKmwQZnkJ7v7Q'
headers = {
        'ZSESSIONID': apiKey,
        'Content-Type': 'application/json'
    }
queryParams = {'copyMilestones': 'true','copyTimeboxes':'true', 'copyUserPermissions':'true','copySharedPages':'true','workspace': 'https://rally1.rallydev.com/slm/webservice/v2.0/workspace/697475434057'}
projectData = {
    'Project': {
        'Name': 'John_s 6th Child Project',
        'Parent': {
            '_ref': 'https://rally1.rallydev.com/slm/webservice/v2.0/project/697475442123'
        },
        'State': 'Open'
    }
}
response = requests.post('https://rally1.rallydev.com/slm/webservice/v2.0/project/create', headers=headers, params=queryParams, json=projectData)
print (response.status_code, response)