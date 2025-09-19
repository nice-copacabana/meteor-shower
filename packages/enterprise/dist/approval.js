import chalk from 'chalk';
export class ApprovalManager {
    constructor() {
        this.requests = new Map();
        this.nextId = 1;
    }
    async createRequest(type, title, description, requester, data) {
        const request = {
            id: `req-${this.nextId++}`,
            type,
            title,
            description,
            requester,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            data,
            comments: []
        };
        this.requests.set(request.id, request);
        console.log(chalk.blue(`📝 审批请求创建: ${title} (${type})`));
        return request;
    }
    async approveRequest(requestId, approver, comment) {
        const request = this.requests.get(requestId);
        if (!request)
            return false;
        request.status = 'approved';
        request.approver = approver;
        request.updatedAt = new Date();
        if (comment) {
            request.comments.push({
                id: `comment-${Date.now()}`,
                author: approver,
                content: comment,
                createdAt: new Date()
            });
        }
        console.log(chalk.green(`✅ 审批通过: ${request.title} (审批人: ${approver})`));
        return true;
    }
    async rejectRequest(requestId, approver, comment) {
        const request = this.requests.get(requestId);
        if (!request)
            return false;
        request.status = 'rejected';
        request.approver = approver;
        request.updatedAt = new Date();
        request.comments.push({
            id: `comment-${Date.now()}`,
            author: approver,
            content: comment,
            createdAt: new Date()
        });
        console.log(chalk.red(`❌ 审批拒绝: ${request.title} (审批人: ${approver})`));
        return true;
    }
    async getRequest(requestId) {
        return this.requests.get(requestId) || null;
    }
    async listRequests(status) {
        const allRequests = Array.from(this.requests.values());
        if (status) {
            return allRequests.filter(req => req.status === status);
        }
        return allRequests;
    }
    async addComment(requestId, author, content) {
        const request = this.requests.get(requestId);
        if (!request)
            return false;
        request.comments.push({
            id: `comment-${Date.now()}`,
            author,
            content,
            createdAt: new Date()
        });
        console.log(chalk.gray(`💬 添加评论: ${request.title} (${author})`));
        return true;
    }
    async getPendingCount() {
        return this.listRequests('pending').then(requests => requests.length);
    }
}
