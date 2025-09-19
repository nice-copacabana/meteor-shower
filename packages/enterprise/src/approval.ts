import chalk from 'chalk';

export interface ApprovalRequest {
  id: string;
  type: 'template' | 'config' | 'user';
  title: string;
  description: string;
  requester: string;
  approver?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  data: any;
  comments: ApprovalComment[];
}

export interface ApprovalComment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}

export class ApprovalManager {
  private requests: Map<string, ApprovalRequest> = new Map();
  private nextId = 1;

  async createRequest(
    type: ApprovalRequest['type'],
    title: string,
    description: string,
    requester: string,
    data: any
  ): Promise<ApprovalRequest> {
    const request: ApprovalRequest = {
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

  async approveRequest(requestId: string, approver: string, comment?: string): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request) return false;

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

  async rejectRequest(requestId: string, approver: string, comment: string): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request) return false;

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

  async getRequest(requestId: string): Promise<ApprovalRequest | null> {
    return this.requests.get(requestId) || null;
  }

  async listRequests(status?: ApprovalRequest['status']): Promise<ApprovalRequest[]> {
    const allRequests = Array.from(this.requests.values());
    if (status) {
      return allRequests.filter(req => req.status === status);
    }
    return allRequests;
  }

  async addComment(requestId: string, author: string, content: string): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request) return false;

    request.comments.push({
      id: `comment-${Date.now()}`,
      author,
      content,
      createdAt: new Date()
    });

    console.log(chalk.gray(`💬 添加评论: ${request.title} (${author})`));
    return true;
  }

  async getPendingCount(): Promise<number> {
    return this.listRequests('pending').then(requests => requests.length);
  }
}
