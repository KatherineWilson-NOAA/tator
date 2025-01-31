import { getCookie } from "../../util/get-cookie.js";

export class ProjectDelete {
    constructor({
        projectId
    }){
        this.projectId = projectId;
    }

    async deleteFetch(){     
        const response = await this._fetchPromise();
        const data = await response.json();
        data.status = response.status;
        return data;
    }

    _fetchPromise(){
        console.log(`Deleting project id ${this.projectId}`);
        
        return fetch(`/rest/Project/${this.projectId}`, {
            method: "DELETE",
            mode: "cors",
            credentials: "include",
            headers: {
                "X-CSRFToken": getCookie("csrftoken"),
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });
    }
}