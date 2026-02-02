"""
NewsBreak Advertising API Client
Wrapper for all NewsBreak advertising API endpoints
"""

import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime

BASE_URL = "https://business.newsbreak.com/business-api/v1"


class NewsBreakClient:
    """Client for interacting with the NewsBreak Advertising API"""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Access-Token": access_token,
            "Content-Type": "application/json"
        }
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make an async request to the NewsBreak API"""
        async with httpx.AsyncClient() as client:
            url = f"{BASE_URL}{endpoint}"
            response = await client.request(
                method=method,
                url=url,
                headers=self.headers,
                **kwargs
            )
            return response.json()
    
    # ==================== Account Management ====================
    
    async def get_ad_accounts(self) -> Dict[str, Any]:
        """Get all ad accounts"""
        return await self._request("GET", "/adAccount/getList")
    
    async def get_account_spending_cap(self, ad_account_id: int) -> Dict[str, Any]:
        """Get account spending cap"""
        return await self._request("POST", "/balance/getAccountBudgetInfo", json={
            "ad_account_id": ad_account_id
        })
    
    async def update_account_spending_cap(
        self, 
        ad_account_id: int, 
        budget_cap: float,
        budget_cap_type: int = 1  # 1=DAILY, 2=LIFETIME
    ) -> Dict[str, Any]:
        """Update account spending cap"""
        return await self._request("POST", "/balance/updateAccountsBudget", json={
            "ad_account_id": ad_account_id,
            "budget_cap": budget_cap,
            "budget_cap_type": budget_cap_type
        })
    
    # ==================== Campaign Management ====================
    
    async def get_campaigns(
        self, 
        ad_account_id: int,
        page: int = 1,
        page_size: int = 100
    ) -> Dict[str, Any]:
        """Get all campaigns for an ad account"""
        return await self._request("POST", "/campaign/getList", json={
            "ad_account_id": ad_account_id,
            "page": page,
            "page_size": page_size
        })
    
    async def create_campaign(
        self,
        ad_account_id: int,
        name: str,
        objective: int,  # 1=AWARENESS, 2=TRAFFIC, 3=APP_INSTALL, 4=LEAD_GENERATION
        status: int = 1,  # 1=ON, 2=OFF
        daily_budget: Optional[float] = None,
        lifetime_budget: Optional[float] = None
    ) -> Dict[str, Any]:
        """Create a new campaign"""
        payload = {
            "ad_account_id": ad_account_id,
            "name": name,
            "objective": objective,
            "status": status
        }
        if daily_budget:
            payload["daily_budget"] = daily_budget
        if lifetime_budget:
            payload["lifetime_budget"] = lifetime_budget
        return await self._request("POST", "/campaign/create", json=payload)
    
    async def update_campaign(
        self,
        ad_account_id: int,
        campaign_id: int,
        name: Optional[str] = None,
        daily_budget: Optional[float] = None,
        lifetime_budget: Optional[float] = None
    ) -> Dict[str, Any]:
        """Update an existing campaign"""
        payload = {
            "ad_account_id": ad_account_id,
            "campaign_id": campaign_id
        }
        if name:
            payload["name"] = name
        if daily_budget:
            payload["daily_budget"] = daily_budget
        if lifetime_budget:
            payload["lifetime_budget"] = lifetime_budget
        return await self._request("POST", "/campaign/update", json=payload)
    
    async def update_campaign_status(
        self,
        ad_account_id: int,
        campaign_id: int,
        status: int  # 1=ON, 2=OFF
    ) -> Dict[str, Any]:
        """Update campaign status (ON/OFF)"""
        return await self._request("POST", "/campaign/updateStatus", json={
            "ad_account_id": ad_account_id,
            "campaign_id": campaign_id,
            "status": status
        })
    
    async def delete_campaign(
        self,
        ad_account_id: int,
        campaign_id: int
    ) -> Dict[str, Any]:
        """Delete a campaign"""
        return await self._request("POST", "/campaign/delete", json={
            "ad_account_id": ad_account_id,
            "campaign_id": campaign_id
        })
    
    # ==================== Ad Set Management ====================
    
    async def get_ad_sets(
        self,
        ad_account_id: int,
        campaign_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 100
    ) -> Dict[str, Any]:
        """Get all ad sets"""
        payload = {
            "ad_account_id": ad_account_id,
            "page": page,
            "page_size": page_size
        }
        if campaign_id:
            payload["campaign_id"] = campaign_id
        return await self._request("POST", "/adset/getList", json=payload)
    
    async def create_ad_set(
        self,
        ad_account_id: int,
        campaign_id: int,
        name: str,
        billing_event: int,  # 1=CPC, 2=CPM
        bid_amount: float,
        optimization_goal: int,  # 1=LINK_CLICKS, 2=IMPRESSIONS, 3=REACH
        targeting: Dict[str, Any],
        status: int = 1,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        daily_budget: Optional[float] = None,
        lifetime_budget: Optional[float] = None,
        pacing_type: int = 1  # 1=STANDARD, 2=ACCELERATED
    ) -> Dict[str, Any]:
        """Create a new ad set"""
        payload = {
            "ad_account_id": ad_account_id,
            "campaign_id": campaign_id,
            "name": name,
            "billing_event": billing_event,
            "bid_amount": bid_amount,
            "optimization_goal": optimization_goal,
            "targeting": targeting,
            "status": status,
            "pacing_type": pacing_type
        }
        if start_time:
            payload["start_time"] = start_time
        if end_time:
            payload["end_time"] = end_time
        if daily_budget:
            payload["daily_budget"] = daily_budget
        if lifetime_budget:
            payload["lifetime_budget"] = lifetime_budget
        return await self._request("POST", "/adset/create", json=payload)
    
    async def update_ad_set(
        self,
        ad_account_id: int,
        adset_id: int,
        name: Optional[str] = None,
        bid_amount: Optional[float] = None,
        targeting: Optional[Dict[str, Any]] = None,
        daily_budget: Optional[float] = None,
        lifetime_budget: Optional[float] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update an existing ad set"""
        payload = {
            "ad_account_id": ad_account_id,
            "adset_id": adset_id
        }
        if name:
            payload["name"] = name
        if bid_amount:
            payload["bid_amount"] = bid_amount
        if targeting:
            payload["targeting"] = targeting
        if daily_budget:
            payload["daily_budget"] = daily_budget
        if lifetime_budget:
            payload["lifetime_budget"] = lifetime_budget
        if start_time:
            payload["start_time"] = start_time
        if end_time:
            payload["end_time"] = end_time
        return await self._request("POST", "/adset/update", json=payload)
    
    async def update_ad_set_status(
        self,
        ad_account_id: int,
        adset_id: int,
        status: int  # 1=ON, 2=OFF
    ) -> Dict[str, Any]:
        """Update ad set status (ON/OFF)"""
        return await self._request("POST", "/adset/updateStatus", json={
            "ad_account_id": ad_account_id,
            "adset_id": adset_id,
            "status": status
        })
    
    async def delete_ad_set(
        self,
        ad_account_id: int,
        adset_id: int
    ) -> Dict[str, Any]:
        """Delete an ad set"""
        return await self._request("POST", "/adset/delete", json={
            "ad_account_id": ad_account_id,
            "adset_id": adset_id
        })
    
    # ==================== Ad Management ====================
    
    async def get_ads(
        self,
        ad_account_id: int,
        adset_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 100
    ) -> Dict[str, Any]:
        """Get all ads"""
        payload = {
            "ad_account_id": ad_account_id,
            "page": page,
            "page_size": page_size
        }
        if adset_id:
            payload["adset_id"] = adset_id
        return await self._request("POST", "/ad/getList", json=payload)
    
    async def create_ad(
        self,
        ad_account_id: int,
        adset_id: int,
        name: str,
        creative: Dict[str, Any],
        status: int = 1,
        tracking_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new ad"""
        payload = {
            "ad_account_id": ad_account_id,
            "adset_id": adset_id,
            "name": name,
            "creative": creative,
            "status": status
        }
        if tracking_url:
            payload["tracking_url"] = tracking_url
        return await self._request("POST", "/ad/create", json=payload)
    
    async def update_ad(
        self,
        ad_account_id: int,
        ad_id: int,
        name: Optional[str] = None,
        creative: Optional[Dict[str, Any]] = None,
        tracking_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update an existing ad"""
        payload = {
            "ad_account_id": ad_account_id,
            "ad_id": ad_id
        }
        if name:
            payload["name"] = name
        if creative:
            payload["creative"] = creative
        if tracking_url:
            payload["tracking_url"] = tracking_url
        return await self._request("POST", "/ad/update", json=payload)
    
    async def update_ad_status(
        self,
        ad_account_id: int,
        ad_id: int,
        status: int  # 1=ON, 2=OFF
    ) -> Dict[str, Any]:
        """Update ad status (ON/OFF)"""
        return await self._request("POST", "/ad/updateStatus", json={
            "ad_account_id": ad_account_id,
            "ad_id": ad_id,
            "status": status
        })
    
    async def delete_ad(
        self,
        ad_account_id: int,
        ad_id: int
    ) -> Dict[str, Any]:
        """Delete an ad"""
        return await self._request("POST", "/ad/delete", json={
            "ad_account_id": ad_account_id,
            "ad_id": ad_id
        })
    
    async def upload_ad_asset(
        self,
        ad_account_id: int,
        file_path: str,
        asset_type: int  # 1=IMAGE, 2=VIDEO
    ) -> Dict[str, Any]:
        """Upload an ad asset (image or video)"""
        async with httpx.AsyncClient() as client:
            with open(file_path, "rb") as f:
                files = {"file": f}
                data = {
                    "ad_account_id": ad_account_id,
                    "asset_type": asset_type
                }
                response = await client.post(
                    f"{BASE_URL}/asset/upload",
                    headers={"Access-Token": self.access_token},
                    files=files,
                    data=data
                )
                return response.json()
    
    # ==================== Reporting ====================
    
    async def create_custom_report(
        self,
        ad_account_id: int,
        name: str,
        date_range: Dict[str, str],
        dimensions: List[str],
        metrics: List[str],
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a custom report"""
        payload = {
            "ad_account_id": ad_account_id,
            "name": name,
            "date_range": date_range,
            "dimensions": dimensions,
            "metrics": metrics
        }
        if filters:
            payload["filters"] = filters
        return await self._request("POST", "/report/create", json=payload)
    
    async def run_sync_report(
        self,
        ad_account_id: int,
        date_range: Dict[str, str],
        dimensions: List[str],
        metrics: List[str],
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Run a synchronous report"""
        payload = {
            "ad_account_id": ad_account_id,
            "date_range": date_range,
            "dimensions": dimensions,
            "metrics": metrics
        }
        if filters:
            payload["filters"] = filters
        return await self._request("POST", "/report/sync", json=payload)
    
    async def get_report_by_id(self, report_id: int) -> Dict[str, Any]:
        """Get a custom report by ID"""
        return await self._request("GET", f"/report/{report_id}")
    
    # ==================== Events ====================
    
    async def get_events(self, ad_account_id: int) -> Dict[str, Any]:
        """Get conversion events"""
        return await self._request("POST", "/event/getList", json={
            "ad_account_id": ad_account_id
        })
