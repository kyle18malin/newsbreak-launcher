"""
NewsBreak Ad Launcher - FastAPI Backend
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import os

from database import init_db, get_db, Organization, AccessToken, CachedAdAccount, CampaignTemplate, LaunchHistory
from newsbreak_client import NewsBreakClient

app = FastAPI(
    title="NewsBreak Ad Launcher",
    description="Launch and manage campaigns across multiple NewsBreak ad accounts",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup():
    init_db()


# ==================== Pydantic Models ====================

class OrganizationCreate(BaseModel):
    name: str
    description: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class AccessTokenCreate(BaseModel):
    name: str
    token: str
    organization_id: Optional[int] = None

class AccessTokenResponse(BaseModel):
    id: int
    name: str
    organization_id: Optional[int]
    is_active: bool
    created_at: datetime
    last_used: Optional[datetime]
    
    class Config:
        from_attributes = True

class CampaignCreate(BaseModel):
    name: str
    objective: int  # 1=AWARENESS, 2=TRAFFIC, 3=APP_INSTALL, 4=LEAD_GENERATION
    daily_budget: Optional[float] = None
    lifetime_budget: Optional[float] = None
    status: int = 1  # 1=ON, 2=OFF

class AdSetCreate(BaseModel):
    name: str
    campaign_id: int
    billing_event: int  # 1=CPC, 2=CPM
    bid_amount: float
    optimization_goal: int  # 1=LINK_CLICKS, 2=IMPRESSIONS, 3=REACH
    targeting: Dict[str, Any]
    status: int = 1
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    daily_budget: Optional[float] = None
    lifetime_budget: Optional[float] = None
    pacing_type: int = 1

class AdCreate(BaseModel):
    name: str
    adset_id: int
    creative: Dict[str, Any]
    status: int = 1
    tracking_url: Optional[str] = None

class BulkLaunchRequest(BaseModel):
    account_ids: List[int]  # List of CachedAdAccount IDs
    campaign: CampaignCreate
    ad_set: Optional[AdSetCreate] = None
    ad: Optional[AdCreate] = None

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    objective: int
    daily_budget: Optional[float] = None
    lifetime_budget: Optional[float] = None
    billing_event: Optional[int] = None
    bid_amount: Optional[float] = None
    optimization_goal: Optional[int] = None
    targeting_json: Optional[str] = None


# ==================== Organization Routes ====================

@app.get("/api/organizations", response_model=List[OrganizationResponse])
async def get_organizations(db: Session = Depends(get_db)):
    """Get all organizations"""
    return db.query(Organization).all()

@app.post("/api/organizations", response_model=OrganizationResponse)
async def create_organization(org: OrganizationCreate, db: Session = Depends(get_db)):
    """Create a new organization"""
    db_org = Organization(name=org.name, description=org.description)
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org

@app.delete("/api/organizations/{org_id}")
async def delete_organization(org_id: int, db: Session = Depends(get_db)):
    """Delete an organization"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    db.delete(org)
    db.commit()
    return {"message": "Organization deleted"}


# ==================== Access Token Routes ====================

@app.get("/api/tokens", response_model=List[AccessTokenResponse])
async def get_tokens(db: Session = Depends(get_db)):
    """Get all access tokens"""
    return db.query(AccessToken).all()

@app.post("/api/tokens", response_model=AccessTokenResponse)
async def create_token(token_data: AccessTokenCreate, db: Session = Depends(get_db)):
    """Add a new access token"""
    db_token = AccessToken(
        name=token_data.name,
        token=token_data.token,
        organization_id=token_data.organization_id
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

@app.delete("/api/tokens/{token_id}")
async def delete_token(token_id: int, db: Session = Depends(get_db)):
    """Delete an access token"""
    token = db.query(AccessToken).filter(AccessToken.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    db.delete(token)
    db.commit()
    return {"message": "Token deleted"}

@app.post("/api/tokens/{token_id}/refresh-accounts")
async def refresh_accounts(token_id: int, db: Session = Depends(get_db)):
    """Refresh cached ad accounts for a token"""
    token = db.query(AccessToken).filter(AccessToken.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    client = NewsBreakClient(token.token)
    try:
        response = await client.get_ad_accounts()
        print(f"NewsBreak API Response: {response}")  # Debug logging
        
        # Handle different response formats
        if isinstance(response, dict):
            # Check for error code
            code = response.get("code")
            if code is not None and code != 0:
                error_msg = response.get("message") or response.get("msg") or response.get("errMsg") or f"API error code: {code}"
                raise HTTPException(status_code=400, detail=f"NewsBreak API Error: {error_msg}")
            
            # Extract accounts - NewsBreak returns organizations with nested adAccounts
            accounts = []
            if "data" in response:
                data = response["data"]
                if isinstance(data, dict) and "list" in data:
                    # Response structure: { data: { list: [{ id, name, adAccounts: [...] }] } }
                    orgs = data.get("list", [])
                    for org in orgs:
                        org_id = org.get("id")
                        org_name = org.get("name")
                        ad_accounts = org.get("adAccounts", [])
                        for acc in ad_accounts:
                            accounts.append({
                                "id": acc.get("id"),
                                "name": acc.get("name"),
                                "org_id": org_id,
                                "org_name": org_name,
                                "createTime": acc.get("createTime")
                            })
                elif isinstance(data, list):
                    accounts = data
        else:
            raise HTTPException(status_code=400, detail=f"Unexpected response format: {type(response)}")
        
        # Clear existing cached accounts for this token
        db.query(CachedAdAccount).filter(CachedAdAccount.access_token_id == token_id).delete()
        
        # Cache new accounts
        for account in accounts:
            cached = CachedAdAccount(
                access_token_id=token_id,
                newsbreak_account_id=account.get("id") or account.get("account_id") or account.get("ad_account_id"),
                name=account.get("name") or account.get("account_name"),
                status=account.get("status") or "active"
            )
            db.add(cached)
        
        # Update last used
        token.last_used = datetime.utcnow()
        db.commit()
        
        return {"message": f"Refreshed {len(accounts)} accounts", "accounts": accounts, "raw_response": response}
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error refreshing accounts: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ==================== Ad Account Routes ====================

@app.get("/api/accounts")
async def get_all_accounts(db: Session = Depends(get_db)):
    """Get all cached ad accounts"""
    accounts = db.query(CachedAdAccount).all()
    result = []
    for acc in accounts:
        result.append({
            "id": acc.id,
            "newsbreak_account_id": acc.newsbreak_account_id,
            "name": acc.name,
            "status": acc.status,
            "token_id": acc.access_token_id,
            "token_name": acc.access_token.name if acc.access_token else None,
            "organization_id": acc.access_token.organization_id if acc.access_token else None,
            "organization_name": acc.access_token.organization.name if acc.access_token and acc.access_token.organization else None
        })
    return result

@app.get("/api/accounts/{account_id}/campaigns")
async def get_account_campaigns(account_id: int, db: Session = Depends(get_db)):
    """Get campaigns for a specific ad account"""
    account = db.query(CachedAdAccount).filter(CachedAdAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    client = NewsBreakClient(account.access_token.token)
    response = await client.get_campaigns(account.newsbreak_account_id)
    
    if response.get("code") != 0:
        raise HTTPException(status_code=400, detail=response.get("message", "API error"))
    
    return response.get("data", {})

@app.get("/api/accounts/{account_id}/adsets")
async def get_account_adsets(account_id: int, campaign_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get ad sets for a specific ad account"""
    account = db.query(CachedAdAccount).filter(CachedAdAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    client = NewsBreakClient(account.access_token.token)
    response = await client.get_ad_sets(account.newsbreak_account_id, campaign_id)
    
    if response.get("code") != 0:
        raise HTTPException(status_code=400, detail=response.get("message", "API error"))
    
    return response.get("data", {})

@app.get("/api/accounts/{account_id}/ads")
async def get_account_ads(account_id: int, adset_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get ads for a specific ad account"""
    account = db.query(CachedAdAccount).filter(CachedAdAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    client = NewsBreakClient(account.access_token.token)
    response = await client.get_ads(account.newsbreak_account_id, adset_id)
    
    if response.get("code") != 0:
        raise HTTPException(status_code=400, detail=response.get("message", "API error"))
    
    return response.get("data", {})


# ==================== Campaign Management Routes ====================

@app.post("/api/accounts/{account_id}/campaigns")
async def create_campaign(account_id: int, campaign: CampaignCreate, db: Session = Depends(get_db)):
    """Create a campaign in a specific ad account"""
    account = db.query(CachedAdAccount).filter(CachedAdAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    client = NewsBreakClient(account.access_token.token)
    response = await client.create_campaign(
        ad_account_id=account.newsbreak_account_id,
        name=campaign.name,
        objective=campaign.objective,
        status=campaign.status,
        daily_budget=campaign.daily_budget,
        lifetime_budget=campaign.lifetime_budget
    )
    
    if response.get("code") != 0:
        raise HTTPException(status_code=400, detail=response.get("message", "API error"))
    
    return response.get("data", {})

@app.post("/api/accounts/{account_id}/adsets")
async def create_adset(account_id: int, adset: AdSetCreate, db: Session = Depends(get_db)):
    """Create an ad set in a specific ad account"""
    account = db.query(CachedAdAccount).filter(CachedAdAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    client = NewsBreakClient(account.access_token.token)
    response = await client.create_ad_set(
        ad_account_id=account.newsbreak_account_id,
        campaign_id=adset.campaign_id,
        name=adset.name,
        billing_event=adset.billing_event,
        bid_amount=adset.bid_amount,
        optimization_goal=adset.optimization_goal,
        targeting=adset.targeting,
        status=adset.status,
        start_time=adset.start_time,
        end_time=adset.end_time,
        daily_budget=adset.daily_budget,
        lifetime_budget=adset.lifetime_budget,
        pacing_type=adset.pacing_type
    )
    
    if response.get("code") != 0:
        raise HTTPException(status_code=400, detail=response.get("message", "API error"))
    
    return response.get("data", {})

@app.post("/api/accounts/{account_id}/ads")
async def create_ad(account_id: int, ad: AdCreate, db: Session = Depends(get_db)):
    """Create an ad in a specific ad account"""
    account = db.query(CachedAdAccount).filter(CachedAdAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    client = NewsBreakClient(account.access_token.token)
    response = await client.create_ad(
        ad_account_id=account.newsbreak_account_id,
        adset_id=ad.adset_id,
        name=ad.name,
        creative=ad.creative,
        status=ad.status,
        tracking_url=ad.tracking_url
    )
    
    if response.get("code") != 0:
        raise HTTPException(status_code=400, detail=response.get("message", "API error"))
    
    return response.get("data", {})


# ==================== Bulk Launch Routes ====================

@app.post("/api/bulk-launch")
async def bulk_launch_campaign(request: BulkLaunchRequest, db: Session = Depends(get_db)):
    """Launch a campaign across multiple ad accounts"""
    results = {
        "succeeded": [],
        "failed": []
    }
    
    for account_id in request.account_ids:
        account = db.query(CachedAdAccount).filter(CachedAdAccount.id == account_id).first()
        if not account:
            results["failed"].append({
                "account_id": account_id,
                "error": "Account not found"
            })
            continue
        
        try:
            client = NewsBreakClient(account.access_token.token)
            
            # Create campaign
            campaign_response = await client.create_campaign(
                ad_account_id=account.newsbreak_account_id,
                name=request.campaign.name,
                objective=request.campaign.objective,
                status=request.campaign.status,
                daily_budget=request.campaign.daily_budget,
                lifetime_budget=request.campaign.lifetime_budget
            )
            
            if campaign_response.get("code") != 0:
                results["failed"].append({
                    "account_id": account_id,
                    "account_name": account.name,
                    "error": campaign_response.get("message", "Campaign creation failed")
                })
                continue
            
            campaign_id = campaign_response.get("data", {}).get("campaign_id")
            result_data = {
                "account_id": account_id,
                "account_name": account.name,
                "campaign_id": campaign_id
            }
            
            # Create ad set if provided
            if request.ad_set:
                adset_response = await client.create_ad_set(
                    ad_account_id=account.newsbreak_account_id,
                    campaign_id=campaign_id,
                    name=request.ad_set.name,
                    billing_event=request.ad_set.billing_event,
                    bid_amount=request.ad_set.bid_amount,
                    optimization_goal=request.ad_set.optimization_goal,
                    targeting=request.ad_set.targeting,
                    status=request.ad_set.status,
                    start_time=request.ad_set.start_time,
                    end_time=request.ad_set.end_time,
                    daily_budget=request.ad_set.daily_budget,
                    lifetime_budget=request.ad_set.lifetime_budget,
                    pacing_type=request.ad_set.pacing_type
                )
                
                if adset_response.get("code") == 0:
                    result_data["adset_id"] = adset_response.get("data", {}).get("adset_id")
                    
                    # Create ad if provided
                    if request.ad:
                        ad_response = await client.create_ad(
                            ad_account_id=account.newsbreak_account_id,
                            adset_id=result_data["adset_id"],
                            name=request.ad.name,
                            creative=request.ad.creative,
                            status=request.ad.status,
                            tracking_url=request.ad.tracking_url
                        )
                        if ad_response.get("code") == 0:
                            result_data["ad_id"] = ad_response.get("data", {}).get("ad_id")
            
            results["succeeded"].append(result_data)
            
        except Exception as e:
            results["failed"].append({
                "account_id": account_id,
                "account_name": account.name if account else None,
                "error": str(e)
            })
    
    # Save to launch history
    history = LaunchHistory(
        campaign_name=request.campaign.name,
        accounts_targeted=json.dumps(request.account_ids),
        accounts_succeeded=json.dumps([r["account_id"] for r in results["succeeded"]]),
        accounts_failed=json.dumps([r["account_id"] for r in results["failed"]]),
        error_messages=json.dumps({r["account_id"]: r["error"] for r in results["failed"]})
    )
    db.add(history)
    db.commit()
    
    return results


# ==================== Template Routes ====================

@app.get("/api/templates")
async def get_templates(db: Session = Depends(get_db)):
    """Get all campaign templates"""
    return db.query(CampaignTemplate).all()

@app.post("/api/templates")
async def create_template(template: TemplateCreate, db: Session = Depends(get_db)):
    """Create a new campaign template"""
    db_template = CampaignTemplate(
        name=template.name,
        description=template.description,
        objective=template.objective,
        daily_budget=template.daily_budget,
        lifetime_budget=template.lifetime_budget,
        billing_event=template.billing_event,
        bid_amount=template.bid_amount,
        optimization_goal=template.optimization_goal,
        targeting_json=template.targeting_json
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@app.delete("/api/templates/{template_id}")
async def delete_template(template_id: int, db: Session = Depends(get_db)):
    """Delete a template"""
    template = db.query(CampaignTemplate).filter(CampaignTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}


# ==================== Launch History Routes ====================

@app.get("/api/history")
async def get_launch_history(db: Session = Depends(get_db)):
    """Get launch history"""
    history = db.query(LaunchHistory).order_by(LaunchHistory.launched_at.desc()).limit(50).all()
    results = []
    for h in history:
        results.append({
            "id": h.id,
            "campaign_name": h.campaign_name,
            "accounts_targeted": json.loads(h.accounts_targeted) if h.accounts_targeted else [],
            "accounts_succeeded": json.loads(h.accounts_succeeded) if h.accounts_succeeded else [],
            "accounts_failed": json.loads(h.accounts_failed) if h.accounts_failed else [],
            "error_messages": json.loads(h.error_messages) if h.error_messages else {},
            "launched_at": h.launched_at
        })
    return results


# ==================== Dashboard Stats ====================

@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    total_accounts = db.query(CachedAdAccount).count()
    total_tokens = db.query(AccessToken).filter(AccessToken.is_active == True).count()
    total_orgs = db.query(Organization).count()
    total_templates = db.query(CampaignTemplate).count()
    total_launches = db.query(LaunchHistory).count()
    
    return {
        "total_accounts": total_accounts,
        "total_tokens": total_tokens,
        "total_organizations": total_orgs,
        "total_templates": total_templates,
        "total_launches": total_launches
    }


# ==================== Static Files (Frontend) ====================

# Serve static files if the frontend build exists
# Check multiple possible locations
possible_paths = [
    os.path.join(os.path.dirname(__file__), "frontend", "dist"),  # Docker: /app/backend/frontend/dist
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"),  # Local dev
]

frontend_path = None
for path in possible_paths:
    if os.path.exists(path):
        frontend_path = path
        break

if frontend_path:
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")
    
    @app.get("/")
    async def serve_index():
        """Serve the frontend index"""
        return FileResponse(os.path.join(frontend_path, "index.html"))
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve the frontend for all non-API routes"""
        if full_path.startswith("api"):
            raise HTTPException(status_code=404)
        index_file = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
